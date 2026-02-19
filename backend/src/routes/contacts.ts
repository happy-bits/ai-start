import { zValidator } from '@hono/zod-validator';
import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull, not } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Hono } from 'hono';
import { z } from 'zod';
import { DATE_FORMAT_MESSAGE, DATE_FORMAT_REGEX, ERROR_MESSAGES, ROLES } from '../constants.js';
import * as schema from '../db/schema.js';
import type { AuthVariables } from '../middleware/auth.js';
import { buildUpdateValues, checkSellerAccess, parseIdParam, withEntityAccess } from './helpers.js';

/** Extract LinkedIn username from URL or return as-is if already username */
function normalizeLinkedIn(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/linkedin\.com\/in\/([^/?]+)/i);
  return match ? match[1] : trimmed;
}

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  followUpDate: z.string().regex(DATE_FORMAT_REGEX, DATE_FORMAT_MESSAGE).optional().nullable(),
});

const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  followUpDate: z.string().regex(DATE_FORMAT_REGEX, DATE_FORMAT_MESSAGE).optional().nullable(),
});

export function createContactRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /contacts - List contacts (sellers see their own, admins see all) - excludes soft-deleted
  app.get('/', (c) => {
    const user = c.get('user');

    let conditions = isNull(schema.contacts.deletedAt);

    // Sellers only see their own contacts
    if (user.role === ROLES.SELLER) {
      conditions = and(
        eq(schema.contacts.sellerId, user.id),
        isNull(schema.contacts.deletedAt),
      ) as typeof conditions;
    }

    const contacts = db.select().from(schema.contacts).where(conditions).all();
    return c.json({ contacts });
  });

  // GET /contacts/wastebin - List soft-deleted contacts (MUST come before /:id route)
  app.get('/wastebin', (c) => {
    const user = c.get('user');

    let conditions = not(isNull(schema.contacts.deletedAt));

    // Sellers only see their own deleted contacts
    if (user.role === ROLES.SELLER) {
      conditions = and(
        eq(schema.contacts.sellerId, user.id),
        not(isNull(schema.contacts.deletedAt)),
      ) as typeof conditions;
    }

    const contacts = db.select().from(schema.contacts).where(conditions).all();
    return c.json({ contacts });
  });

  // GET /contacts/:id - Get contact details (excludes soft-deleted)
  app.get('/:id', (c) => {
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'Contact');
    if (!parsed.success) return parsed.response;

    const contact = db
      .select()
      .from(schema.contacts)
      .where(and(eq(schema.contacts.id, parsed.id), isNull(schema.contacts.deletedAt)))
      .get() as InferSelectModel<typeof schema.contacts> | undefined;

    if (!contact) {
      return c.json({ error: ERROR_MESSAGES.notFound('Contact') }, 404);
    }

    const accessDenied = checkSellerAccess(user, contact.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    return c.json({ contact });
  });

  // POST /contacts - Create new contact
  app.post('/', zValidator('json', createContactSchema), (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');

    const now = new Date().toISOString();

    const contact = db
      .insert(schema.contacts)
      .values({
        sellerId: user.id,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        linkedin: normalizeLinkedIn(data.linkedin),
        followUpDate: data.followUpDate ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return c.json({ contact }, 201);
  });

  // PUT /contacts/:id - Update contact
  app.put('/:id', zValidator('json', updateContactSchema), (c) => {
    const result = withEntityAccess<InferSelectModel<typeof schema.contacts>>(
      c,
      db,
      schema.contacts,
      'Contact',
    );
    if (!result.success) return result.response;

    const updates = c.req.valid('json');
    const normalizedUpdates = {
      ...updates,
      linkedin: updates.linkedin !== undefined ? normalizeLinkedIn(updates.linkedin) : undefined,
    };
    const updateValues = buildUpdateValues(normalizedUpdates, [
      'name',
      'email',
      'phone',
      'company',
      'linkedin',
      'followUpDate',
    ]);

    const contact = db
      .update(schema.contacts)
      .set(updateValues)
      .where(eq(schema.contacts.id, result.entity.id))
      .returning()
      .get();

    return c.json({ contact });
  });

  // DELETE /contacts/:id - Soft delete contact (move to wastebin)
  app.delete('/:id', (c) => {
    const result = withEntityAccess<InferSelectModel<typeof schema.contacts>>(
      c,
      db,
      schema.contacts,
      'Contact',
    );
    if (!result.success) return result.response;

    const now = new Date().toISOString();
    db.update(schema.contacts)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.contacts.id, result.entity.id))
      .run();

    return c.json({ message: ERROR_MESSAGES.deletedSuccessfully('Contact') });
  });

  // POST /contacts/:id/restore - Restore soft-deleted contact
  app.post('/:id/restore', (c) => {
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'Contact');
    if (!parsed.success) return parsed.response;

    // Allow access to deleted contacts for restore
    const contact = db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.id, parsed.id))
      .get() as InferSelectModel<typeof schema.contacts> | undefined;

    if (!contact) {
      return c.json({ error: ERROR_MESSAGES.notFound('Contact') }, 404);
    }

    if (!contact.deletedAt) {
      return c.json({ error: 'Contact is not deleted' }, 400);
    }

    const accessDenied = checkSellerAccess(user, contact.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    const now = new Date().toISOString();
    const restored = db
      .update(schema.contacts)
      .set({ deletedAt: null, updatedAt: now })
      .where(eq(schema.contacts.id, parsed.id))
      .returning()
      .get();

    return c.json({ contact: restored });
  });

  // DELETE /contacts/:id/permanent - Permanently delete contact
  app.delete('/:id/permanent', (c) => {
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'Contact');
    if (!parsed.success) return parsed.response;

    // Allow access to deleted contacts for permanent deletion
    const contact = db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.id, parsed.id))
      .get() as InferSelectModel<typeof schema.contacts> | undefined;

    if (!contact) {
      return c.json({ error: ERROR_MESSAGES.notFound('Contact') }, 404);
    }

    const accessDenied = checkSellerAccess(user, contact.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    db.delete(schema.contacts).where(eq(schema.contacts.id, parsed.id)).run();

    return c.json({ message: 'Contact permanently deleted' });
  });

  return app;
}

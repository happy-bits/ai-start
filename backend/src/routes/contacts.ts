import { zValidator } from '@hono/zod-validator';
import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull, not } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  DATE_FORMAT_MESSAGE,
  DATE_FORMAT_REGEX,
  ERROR_MESSAGES,
  INTERACTION_TYPE_VALUES,
  NEXT_CONTACT_CHANNEL_VALUES,
  ROLES,
} from '../constants.js';
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
  nextContactChannel: z.enum(NEXT_CONTACT_CHANNEL_VALUES).optional().nullable(),
  interactions: z
    .array(
      z.object({
        type: z.enum(INTERACTION_TYPE_VALUES),
        date: z.string().regex(DATE_FORMAT_REGEX, DATE_FORMAT_MESSAGE),
        time: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }),
    )
    .optional()
    .default([]),
});

const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  followUpDate: z.string().regex(DATE_FORMAT_REGEX, DATE_FORMAT_MESSAGE).optional().nullable(),
  nextContactChannel: z.enum(NEXT_CONTACT_CHANNEL_VALUES).optional().nullable(),
});

export function createContactRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /contacts/export - Export contacts as CSV (semicolon, UTF-8 BOM) for Google Spreadsheet
  app.get('/export', (c) => {
    const user = c.get('user');

    let conditions = isNull(schema.contacts.deletedAt);

    if (user.role === ROLES.SELLER) {
      conditions = and(
        eq(schema.contacts.sellerId, user.id),
        isNull(schema.contacts.deletedAt),
      ) as typeof conditions;
    }

    const contacts = db.select().from(schema.contacts).where(conditions).all();

    const columns = [
      'name',
      'email',
      'phone',
      'company',
      'linkedin',
      'followUpDate',
      'nextContactChannel',
    ] as const;

    const escapeCsvField = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const s = String(value);
      if (/[;"\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = columns.join(';');
    const rows = contacts.map((contact) =>
      columns.map((col) => escapeCsvField(contact[col])).join(';'),
    );
    const csv = [header, ...rows].join('\r\n');
    const bom = '\uFEFF';
    const body = bom + csv;

    const filename = `keepwarm-kontakter-${new Date().toISOString().slice(0, 10)}.csv`;
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.body(body);
  });

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

  const bulkCreateSchema = z.object({
    contacts: z.array(createContactSchema).min(1, 'At least one contact is required'),
  });

  // POST /contacts/bulk - Create multiple contacts with optional interactions (MUST come before /:id route)
  app.post('/bulk', zValidator('json', bulkCreateSchema), (c) => {
    const user = c.get('user');
    const { contacts: contactsData } = c.req.valid('json');

    const now = new Date().toISOString();

    // Use transaction to ensure atomicity: all contacts and interactions created together or none
    const result = db.transaction((tx) => {
      // Insert all contacts first
      const insertedContacts = tx
        .insert(schema.contacts)
        .values(
          contactsData.map((data) => ({
            sellerId: user.id,
            name: data.name,
            email: data.email ?? null,
            phone: data.phone ?? null,
            company: data.company ?? null,
            linkedin: normalizeLinkedIn(data.linkedin),
            followUpDate: data.followUpDate ?? null,
            nextContactChannel: data.nextContactChannel ?? null,
            createdAt: now,
            updatedAt: now,
          })),
        )
        .returning()
        .all();

      // Collect all interactions to insert
      const interactionsToInsert: Array<{
        contactId: number;
        sellerId: number;
        type: string;
        date: string;
        time: string | null;
        notes: string | null;
        createdAt: string;
        updatedAt: string;
      }> = [];

      // Map interactions to their corresponding contact IDs
      contactsData.forEach((contactData, index) => {
        const contactId = insertedContacts[index].id;
        const interactions = contactData.interactions ?? [];
        interactions.forEach((interaction) => {
          interactionsToInsert.push({
            contactId,
            sellerId: user.id,
            type: interaction.type,
            date: interaction.date,
            time: interaction.time ?? null,
            notes: interaction.notes ?? null,
            createdAt: now,
            updatedAt: now,
          });
        });
      });

      // Insert all interactions if any
      const insertedInteractions =
        interactionsToInsert.length > 0
          ? tx.insert(schema.interactions).values(interactionsToInsert).returning().all()
          : [];

      return { contacts: insertedContacts, interactions: insertedInteractions };
    });

    return c.json(
      {
        contacts: result.contacts,
        interactions: result.interactions,
      },
      201,
    );
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
        nextContactChannel: data.nextContactChannel ?? null,
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
      'nextContactChannel',
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

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { type AuthVariables } from '../middleware/auth.js';
import { withEntityAccess, buildUpdateValues, checkSellerAccess } from './helpers.js';
import {
  DATE_FORMAT_MESSAGE,
  DATE_FORMAT_REGEX,
  ERROR_MESSAGES,
  INTERACTION_TYPE_VALUES,
  ROLES,
} from '../constants.js';

const createInteractionSchema = z.object({
  contactId: z.number().int().positive(),
  type: z.enum(INTERACTION_TYPE_VALUES),
  date: z.string().regex(DATE_FORMAT_REGEX, DATE_FORMAT_MESSAGE),
  time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateInteractionSchema = z.object({
  type: z.enum(INTERACTION_TYPE_VALUES).optional(),
  date: z.string().regex(DATE_FORMAT_REGEX, DATE_FORMAT_MESSAGE).optional(),
  time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export function createInteractionRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /interactions - List interactions (sellers see their own, admins see all)
  app.get('/', (c) => {
    const user = c.get('user');
    const contactId = c.req.query('contactId');

    let conditions: ReturnType<typeof eq>[] = [];

    // Filter by contact if provided
    if (contactId) {
      const id = parseInt(contactId, 10);
      if (isNaN(id)) {
        return c.json({ error: ERROR_MESSAGES.INVALID_CONTACT_ID }, 400);
      }
      conditions.push(eq(schema.interactions.contactId, id));
    }

    // Sellers only see their own interactions
    if (user.role === ROLES.SELLER) {
      conditions.push(eq(schema.interactions.sellerId, user.id));
    }

    let query = db.select().from(schema.interactions);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const interactions = query.all();
    return c.json({ interactions });
  });

  // GET /interactions/:id - Get interaction details
  app.get('/:id', (c) => {
    const result = withEntityAccess<schema.Interaction>(c, db, schema.interactions, 'Interaction');
    if (!result.success) return result.response;

    return c.json({ interaction: result.entity });
  });

  // POST /interactions - Create new interaction
  app.post('/', zValidator('json', createInteractionSchema), (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');

    // Verify contact exists and belongs to the seller (or user is admin)
    const contact = db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.id, data.contactId))
      .get();

    if (!contact) {
      return c.json({ error: ERROR_MESSAGES.CONTACT_NOT_FOUND }, 404);
    }

    const accessDenied = checkSellerAccess(user, contact.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    const now = new Date().toISOString();

    const interaction = db
      .insert(schema.interactions)
      .values({
        contactId: data.contactId,
        sellerId: user.id,
        type: data.type,
        date: data.date,
        time: data.time ?? null,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return c.json({ interaction }, 201);
  });

  // PUT /interactions/:id - Update interaction
  app.put('/:id', zValidator('json', updateInteractionSchema), (c) => {
    const result = withEntityAccess<schema.Interaction>(c, db, schema.interactions, 'Interaction');
    if (!result.success) return result.response;

    const updates = c.req.valid('json');
    const updateValues = buildUpdateValues(updates, ['type', 'date', 'time', 'notes']);

    const interaction = db
      .update(schema.interactions)
      .set(updateValues)
      .where(eq(schema.interactions.id, result.entity.id))
      .returning()
      .get();

    return c.json({ interaction });
  });

  // DELETE /interactions/:id - Delete interaction
  app.delete('/:id', (c) => {
    const result = withEntityAccess<schema.Interaction>(c, db, schema.interactions, 'Interaction');
    if (!result.success) return result.response;

    db.delete(schema.interactions).where(eq(schema.interactions.id, result.entity.id)).run();

    return c.json({ message: ERROR_MESSAGES.deletedSuccessfully('Interaction') });
  });

  return app;
}




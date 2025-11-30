import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { type AuthVariables } from '../middleware/auth.js';
import { parseIdParam, checkSellerAccess } from './helpers.js';

const createInteractionSchema = z.object({
  customerId: z.number().int().positive(),
  type: z.enum(['call', 'meeting', 'email']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateInteractionSchema = z.object({
  type: z.enum(['call', 'meeting', 'email']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export function createInteractionRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /interactions - List interactions (sellers see their own, admins see all)
  app.get('/', (c) => {
    const user = c.get('user');
    const customerId = c.req.query('customerId');

    let conditions: ReturnType<typeof eq>[] = [];

    // Filter by customer if provided
    if (customerId) {
      const id = parseInt(customerId, 10);
      if (isNaN(id)) {
        return c.json({ error: 'Invalid customer ID' }, 400);
      }
      conditions.push(eq(schema.interactions.customerId, id));
    }

    // Sellers only see their own interactions
    if (user.role === 'seller') {
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
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'interaction');
    if (!parsed.success) return parsed.response;

    const interaction = db
      .select()
      .from(schema.interactions)
      .where(eq(schema.interactions.id, parsed.id))
      .get();

    if (!interaction) {
      return c.json({ error: 'Interaction not found' }, 404);
    }

    const accessDenied = checkSellerAccess(user, interaction.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    return c.json({ interaction });
  });

  // POST /interactions - Create new interaction
  app.post('/', zValidator('json', createInteractionSchema), (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');

    // Verify customer exists and belongs to the seller (or user is admin)
    const customer = db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, data.customerId))
      .get();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const accessDenied = checkSellerAccess(user, customer.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    const now = new Date().toISOString();

    const interaction = db
      .insert(schema.interactions)
      .values({
        customerId: data.customerId,
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
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'interaction');
    if (!parsed.success) return parsed.response;

    const existing = db
      .select()
      .from(schema.interactions)
      .where(eq(schema.interactions.id, parsed.id))
      .get();

    if (!existing) {
      return c.json({ error: 'Interaction not found' }, 404);
    }

    const accessDenied = checkSellerAccess(user, existing.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    const updates = c.req.valid('json');

    const updateValues: Record<string, string | null> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.type !== undefined) updateValues.type = updates.type;
    if (updates.date !== undefined) updateValues.date = updates.date;
    if (updates.time !== undefined) updateValues.time = updates.time;
    if (updates.notes !== undefined) updateValues.notes = updates.notes;

    const interaction = db
      .update(schema.interactions)
      .set(updateValues)
      .where(eq(schema.interactions.id, parsed.id))
      .returning()
      .get();

    return c.json({ interaction });
  });

  // DELETE /interactions/:id - Delete interaction
  app.delete('/:id', (c) => {
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'interaction');
    if (!parsed.success) return parsed.response;

    const existing = db
      .select()
      .from(schema.interactions)
      .where(eq(schema.interactions.id, parsed.id))
      .get();

    if (!existing) {
      return c.json({ error: 'Interaction not found' }, 404);
    }

    const accessDenied = checkSellerAccess(user, existing.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    db.delete(schema.interactions).where(eq(schema.interactions.id, parsed.id)).run();

    return c.json({ message: 'Interaction deleted successfully' });
  });

  return app;
}




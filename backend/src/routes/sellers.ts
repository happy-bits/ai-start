import { zValidator } from '@hono/zod-validator';
import { and, eq, ne } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Hono } from 'hono';
import { z } from 'zod';
import { ERROR_MESSAGES, ROLES } from '../constants.js';
import * as schema from '../db/schema.js';
import { type AuthVariables, adminOnly, hashPassword } from '../middleware/auth.js';
import { buildUpdateValues, parseIdParam } from './helpers.js';

const createSellerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const updateSellerSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
});

// Fields to select for seller responses (excludes passwordHash)
const sellerFields = {
  id: schema.users.id,
  email: schema.users.email,
  name: schema.users.name,
  role: schema.users.role,
  createdAt: schema.users.createdAt,
  updatedAt: schema.users.updatedAt,
};

export function createSellerRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // All seller management routes require admin access
  app.use('/*', adminOnly());

  // GET /sellers - List all sellers
  app.get('/', (c) => {
    const sellers = db
      .select(sellerFields)
      .from(schema.users)
      .where(eq(schema.users.role, ROLES.SELLER))
      .all();

    return c.json({ sellers });
  });

  // GET /sellers/:id - Get seller details
  app.get('/:id', (c) => {
    const parsed = parseIdParam(c, 'id', 'seller');
    if (!parsed.success) return parsed.response;

    const seller = db
      .select(sellerFields)
      .from(schema.users)
      .where(and(eq(schema.users.id, parsed.id), eq(schema.users.role, ROLES.SELLER)))
      .get();

    if (!seller) {
      return c.json({ error: ERROR_MESSAGES.SELLER_NOT_FOUND }, 404);
    }

    return c.json({ seller });
  });

  // POST /sellers - Create new seller
  app.post('/', zValidator('json', createSellerSchema), async (c) => {
    const { email, password, name } = c.req.valid('json');

    // Check if email already exists
    const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();

    if (existing) {
      return c.json({ error: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS }, 409);
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const seller = db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        name,
        role: ROLES.SELLER,
        createdAt: now,
        updatedAt: now,
      })
      .returning(sellerFields)
      .get();

    return c.json({ seller }, 201);
  });

  // PUT /sellers/:id - Update seller
  app.put('/:id', zValidator('json', updateSellerSchema), async (c) => {
    const parsed = parseIdParam(c, 'id', 'seller');
    if (!parsed.success) return parsed.response;

    const updates = c.req.valid('json');

    // Check seller exists and is a seller
    const existing = db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, parsed.id), eq(schema.users.role, ROLES.SELLER)))
      .get();

    if (!existing) {
      return c.json({ error: ERROR_MESSAGES.SELLER_NOT_FOUND }, 404);
    }

    // Check email uniqueness if updating email
    if (updates.email && updates.email !== existing.email) {
      const emailExists = db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.email, updates.email), ne(schema.users.id, parsed.id)))
        .get();

      if (emailExists) {
        return c.json({ error: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS }, 409);
      }
    }

    // Prepare update values
    const updateValues = buildUpdateValues(updates, ['email', 'name']);

    // Handle password separately (requires async hashing)
    if (updates.password) {
      updateValues.passwordHash = await hashPassword(updates.password);
    }

    const seller = db
      .update(schema.users)
      .set(updateValues)
      .where(eq(schema.users.id, parsed.id))
      .returning(sellerFields)
      .get();

    return c.json({ seller });
  });

  // DELETE /sellers/:id - Delete seller
  app.delete('/:id', (c) => {
    const parsed = parseIdParam(c, 'id', 'seller');
    if (!parsed.success) return parsed.response;

    // Check seller exists and is a seller
    const existing = db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, parsed.id), eq(schema.users.role, ROLES.SELLER)))
      .get();

    if (!existing) {
      return c.json({ error: ERROR_MESSAGES.SELLER_NOT_FOUND }, 404);
    }

    db.delete(schema.users).where(eq(schema.users.id, parsed.id)).run();

    return c.json({ message: ERROR_MESSAGES.deletedSuccessfully('Seller') });
  });

  return app;
}

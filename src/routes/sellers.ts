import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { hash } from '@node-rs/argon2';
import { eq, and, ne } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { type AuthVariables, adminOnly } from '../middleware/auth.js';

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

export function createSellerRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // All seller management routes require admin access
  app.use('/*', adminOnly());

  // GET /sellers - List all sellers
  app.get('/', (c) => {
    const sellers = db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.role, 'seller'))
      .all();

    return c.json({ sellers });
  });

  // GET /sellers/:id - Get seller details
  app.get('/:id', (c) => {
    const id = parseInt(c.req.param('id'), 10);

    if (isNaN(id)) {
      return c.json({ error: 'Invalid seller ID' }, 400);
    }

    const seller = db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(and(eq(schema.users.id, id), eq(schema.users.role, 'seller')))
      .get();

    if (!seller) {
      return c.json({ error: 'Seller not found' }, 404);
    }

    return c.json({ seller });
  });

  // POST /sellers - Create new seller
  app.post('/', zValidator('json', createSellerSchema), async (c) => {
    const { email, password, name } = c.req.valid('json');

    // Check if email already exists
    const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();

    if (existing) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const now = new Date().toISOString();

    const seller = db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        name,
        role: 'seller',
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .get();

    return c.json({ seller }, 201);
  });

  // PUT /sellers/:id - Update seller
  app.put('/:id', zValidator('json', updateSellerSchema), async (c) => {
    const id = parseInt(c.req.param('id'), 10);

    if (isNaN(id)) {
      return c.json({ error: 'Invalid seller ID' }, 400);
    }

    const updates = c.req.valid('json');

    // Check seller exists and is a seller
    const existing = db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, id), eq(schema.users.role, 'seller')))
      .get();

    if (!existing) {
      return c.json({ error: 'Seller not found' }, 404);
    }

    // Check email uniqueness if updating email
    if (updates.email && updates.email !== existing.email) {
      const emailExists = db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.email, updates.email), ne(schema.users.id, id)))
        .get();

      if (emailExists) {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }

    // Prepare update values
    const updateValues: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.email) updateValues.email = updates.email;
    if (updates.name) updateValues.name = updates.name;
    if (updates.password) {
      updateValues.passwordHash = await hash(updates.password, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    }

    const seller = db
      .update(schema.users)
      .set(updateValues)
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .get();

    return c.json({ seller });
  });

  // DELETE /sellers/:id - Delete seller
  app.delete('/:id', (c) => {
    const id = parseInt(c.req.param('id'), 10);

    if (isNaN(id)) {
      return c.json({ error: 'Invalid seller ID' }, 400);
    }

    // Check seller exists and is a seller
    const existing = db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, id), eq(schema.users.role, 'seller')))
      .get();

    if (!existing) {
      return c.json({ error: 'Seller not found' }, 404);
    }

    db.delete(schema.users).where(eq(schema.users.id, id)).run();

    return c.json({ message: 'Seller deleted successfully' });
  });

  return app;
}



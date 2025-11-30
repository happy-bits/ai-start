import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { type AuthVariables } from '../middleware/auth.js';
import { parseIdParam, checkSellerAccess } from './helpers.js';

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export function createCustomerRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /customers - List customers (sellers see their own, admins see all)
  app.get('/', (c) => {
    const user = c.get('user');

    let query = db.select().from(schema.customers);

    // Sellers only see their own customers
    if (user.role === 'seller') {
      query = query.where(eq(schema.customers.sellerId, user.id)) as typeof query;
    }

    const customers = query.all();
    return c.json({ customers });
  });

  // GET /customers/:id - Get customer details
  app.get('/:id', (c) => {
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'customer');
    if (!parsed.success) return parsed.response;

    const customer = db.select().from(schema.customers).where(eq(schema.customers.id, parsed.id)).get();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const accessDenied = checkSellerAccess(user, customer.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    return c.json({ customer });
  });

  // POST /customers - Create new customer
  app.post('/', zValidator('json', createCustomerSchema), (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');

    const now = new Date().toISOString();

    const customer = db
      .insert(schema.customers)
      .values({
        sellerId: user.id,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return c.json({ customer }, 201);
  });

  // PUT /customers/:id - Update customer
  app.put('/:id', zValidator('json', updateCustomerSchema), (c) => {
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'customer');
    if (!parsed.success) return parsed.response;

    const existing = db.select().from(schema.customers).where(eq(schema.customers.id, parsed.id)).get();

    if (!existing) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const accessDenied = checkSellerAccess(user, existing.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    const updates = c.req.valid('json');

    const updateValues: Record<string, string | null> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateValues.name = updates.name;
    if (updates.email !== undefined) updateValues.email = updates.email;
    if (updates.phone !== undefined) updateValues.phone = updates.phone;
    if (updates.company !== undefined) updateValues.company = updates.company;
    if (updates.notes !== undefined) updateValues.notes = updates.notes;

    const customer = db
      .update(schema.customers)
      .set(updateValues)
      .where(eq(schema.customers.id, parsed.id))
      .returning()
      .get();

    return c.json({ customer });
  });

  // DELETE /customers/:id - Delete customer
  app.delete('/:id', (c) => {
    const user = c.get('user');
    const parsed = parseIdParam(c, 'id', 'customer');
    if (!parsed.success) return parsed.response;

    const existing = db.select().from(schema.customers).where(eq(schema.customers.id, parsed.id)).get();

    if (!existing) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const accessDenied = checkSellerAccess(user, existing.sellerId);
    if (accessDenied) {
      return c.json({ error: accessDenied.error }, 403);
    }

    db.delete(schema.customers).where(eq(schema.customers.id, parsed.id)).run();

    return c.json({ message: 'Customer deleted successfully' });
  });

  return app;
}




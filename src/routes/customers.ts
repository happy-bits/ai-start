import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { type AuthVariables } from '../middleware/auth.js';
import { withEntityAccess, buildUpdateValues } from './helpers.js';
import { ERROR_MESSAGES, ROLES } from '../constants.js';

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
    if (user.role === ROLES.SELLER) {
      query = query.where(eq(schema.customers.sellerId, user.id)) as typeof query;
    }

    const customers = query.all();
    return c.json({ customers });
  });

  // GET /customers/:id - Get customer details
  app.get('/:id', (c) => {
    const result = withEntityAccess<schema.Customer>(c, db, schema.customers, 'Customer');
    if (!result.success) return result.response;

    return c.json({ customer: result.entity });
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
    const result = withEntityAccess<schema.Customer>(c, db, schema.customers, 'Customer');
    if (!result.success) return result.response;

    const updates = c.req.valid('json');
    const updateValues = buildUpdateValues(updates, ['name', 'email', 'phone', 'company', 'notes']);

    const customer = db
      .update(schema.customers)
      .set(updateValues)
      .where(eq(schema.customers.id, result.entity.id))
      .returning()
      .get();

    return c.json({ customer });
  });

  // DELETE /customers/:id - Delete customer
  app.delete('/:id', (c) => {
    const result = withEntityAccess<schema.Customer>(c, db, schema.customers, 'Customer');
    if (!result.success) return result.response;

    db.delete(schema.customers).where(eq(schema.customers.id, result.entity.id)).run();

    return c.json({ message: ERROR_MESSAGES.deletedSuccessfully('Customer') });
  });

  return app;
}




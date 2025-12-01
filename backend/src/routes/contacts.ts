import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { type AuthVariables } from '../middleware/auth.js';
import { withEntityAccess } from './helpers.js';
import { ERROR_MESSAGES, ROLES } from '../constants.js';

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
});

export function createContactRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /contacts - List contacts (sellers see their own, admins see all)
  app.get('/', (c) => {
    const user = c.get('user');

    let query = db.select().from(schema.contacts);

    // Sellers only see their own contacts
    if (user.role === ROLES.SELLER) {
      query = query.where(eq(schema.contacts.sellerId, user.id)) as typeof query;
    }

    const contacts = query.all();
    return c.json({ contacts });
  });

  // GET /contacts/:id - Get contact details
  app.get('/:id', (c) => {
    const result = withEntityAccess<schema.Contact>(c, db, schema.contacts, 'Contact');
    if (!result.success) return result.response;

    return c.json({ contact: result.entity });
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
        company: data.company ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return c.json({ contact }, 201);
  });

  // DELETE /contacts/:id - Delete contact
  app.delete('/:id', (c) => {
    const result = withEntityAccess<schema.Contact>(c, db, schema.contacts, 'Contact');
    if (!result.success) return result.response;

    db.delete(schema.contacts).where(eq(schema.contacts.id, result.entity.id)).run();

    return c.json({ message: ERROR_MESSAGES.deletedSuccessfully('Contact') });
  });

  return app;
}


import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { createSession, deleteSession, type AuthVariables } from '../middleware/auth.js';
import { AUTH_HEADER_PREFIX, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function createAuthRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // POST /auth/login - Login and get session token
  app.post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    // Find user by email
    const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();

    if (!user) {
      return c.json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS }, 401);
    }

    // Verify password
    const validPassword = await verify(user.passwordHash, password);
    if (!validPassword) {
      return c.json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS }, 401);
    }

    // Create session
    const token = createSession(db, user.id);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  // POST /auth/logout - Logout (invalidate session)
  app.post('/logout', (c) => {
    const authHeader = c.req.header('Authorization');
    const prefix = `${AUTH_HEADER_PREFIX} `;
    if (authHeader?.startsWith(prefix)) {
      const token = authHeader.slice(prefix.length);
      deleteSession(db, token);
    }
    return c.json({ message: SUCCESS_MESSAGES.LOGGED_OUT });
  });

  return app;
}



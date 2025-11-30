import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { createSession, deleteSession, type AuthVariables } from '../middleware/auth.js';

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
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const validPassword = await verify(user.passwordHash, password);
    if (!validPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
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
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      deleteSession(db, token);
    }
    return c.json({ message: 'Logged out successfully' });
  });

  // GET /auth/me - Get current user info (requires auth)
  app.get('/me', (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Not authenticated' }, 401);
    }
    return c.json({ user });
  });

  return app;
}


import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { ERROR_MESSAGES, ROLES, SUCCESS_MESSAGES } from './constants.js';
import { resetDatabase } from './db/index.js';
import type * as schema from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { type AuthVariables, authMiddleware } from './middleware/auth.js';
import { createAuthRoutes } from './routes/auth.js';

import { createContactRoutes } from './routes/contacts.js';
import { createInteractionRoutes } from './routes/interactions.js';
import { createSellerRoutes } from './routes/sellers.js';

export function createApp(
  db: BetterSQLite3Database<typeof schema>,
  options?: { enableLogging?: boolean },
) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // Middleware
  app.use('*', cors());
  if (options?.enableLogging !== false) {
    app.use('*', logger());
  }

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes (login doesn't require auth)
  const authRoutes = createAuthRoutes(db);
  app.route('/auth', authRoutes);

  // Protected routes with auth middleware
  const protectedApp = new Hono<{ Variables: AuthVariables }>();
  protectedApp.use('*', authMiddleware(db));

  // Mount protected routes
  protectedApp.route('/sellers', createSellerRoutes(db));
  protectedApp.route('/contacts', createContactRoutes(db));
  protectedApp.route('/interactions', createInteractionRoutes(db));

  // Get current user
  protectedApp.get('/me', (c) => {
    const user = c.get('user');
    return c.json({ user });
  });

  // Database reset and seed endpoint (development only)
  protectedApp.post('/dev/reset', async (c) => {
    const user = c.get('user');

    if (user.role !== ROLES.ADMIN) {
      return c.json({ error: ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED }, 403);
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return c.json({ error: ERROR_MESSAGES.NOT_AVAILABLE_IN_PRODUCTION }, 403);
    }

    resetDatabase();
    await seedDatabase(db);
    return c.json({ message: SUCCESS_MESSAGES.DATABASE_RESET });
  });

  // Mount protected routes under /api
  app.route('/api', protectedApp);

  // Error handling
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status);
    }

    console.error('Unexpected error:', err);
    return c.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 500);
  });

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: ERROR_MESSAGES.NOT_FOUND }, 404);
  });

  return app;
}

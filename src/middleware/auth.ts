import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq, and, gt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'seller';
};

export type AuthVariables = {
  user: AuthUser;
  db: BetterSQLite3Database<typeof schema>;
};

// Extract bearer token from Authorization header
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

// Authentication middleware - requires valid session token
export function authMiddleware(db: BetterSQLite3Database<typeof schema>) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const token = extractToken(c.req.header('Authorization'));

    if (!token) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const now = new Date().toISOString();

    // Find valid session with user
    const session = db
      .select({
        userId: schema.sessions.userId,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, now)))
      .get();

    if (!session) {
      throw new HTTPException(401, { message: 'Invalid or expired session' });
    }

    // Set user in context
    c.set('user', {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role as 'admin' | 'seller',
    });
    c.set('db', db);

    await next();
  };
}

// Admin-only middleware - must be used after authMiddleware
export function adminOnly() {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const user = c.get('user');

    if (!user || user.role !== 'admin') {
      throw new HTTPException(403, { message: 'Admin access required' });
    }

    await next();
  };
}

// Generate a secure random token
export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomBytes = new Uint8Array(48);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 48; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  return token;
}

// Create session for user
export function createSession(
  db: BetterSQLite3Database<typeof schema>,
  userId: number,
  expiresInHours: number = 24
): string {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  db.insert(schema.sessions)
    .values({
      token,
      userId,
      expiresAt,
      createdAt: new Date().toISOString(),
    })
    .run();

  return token;
}

// Delete session (logout)
export function deleteSession(db: BetterSQLite3Database<typeof schema>, token: string): boolean {
  const result = db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run();
  return result.changes > 0;
}

// Clean up expired sessions
export function cleanupExpiredSessions(db: BetterSQLite3Database<typeof schema>): number {
  const now = new Date().toISOString();
  const result = db.delete(schema.sessions).where(gt(now, schema.sessions.expiresAt)).run();
  return result.changes;
}


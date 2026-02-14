import { hash } from '@node-rs/argon2';
import { and, eq, gt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  ARGON_OPTIONS,
  AUTH_HEADER_PREFIX,
  ERROR_MESSAGES,
  ROLES,
  SESSION_CONFIG,
} from '../constants.js';
import * as schema from '../db/schema.js';

// Hash a password using Argon2
export function hashPassword(password: string) {
  return hash(password, ARGON_OPTIONS);
}

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: typeof ROLES.ADMIN | typeof ROLES.SELLER;
};

export type AuthVariables = {
  user: AuthUser;
};

// Extract bearer token from Authorization header
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== AUTH_HEADER_PREFIX) return null;
  return parts[1];
}

// Authentication middleware - requires valid session token
export function authMiddleware(db: BetterSQLite3Database<typeof schema>) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const token = extractToken(c.req.header('Authorization'));

    if (!token) {
      throw new HTTPException(401, { message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
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
      throw new HTTPException(401, { message: ERROR_MESSAGES.INVALID_OR_EXPIRED_SESSION });
    }

    // Set user in context
    c.set('user', {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role as typeof ROLES.ADMIN | typeof ROLES.SELLER,
    });

    await next();
  };
}

// Admin-only middleware - must be used after authMiddleware
export function adminOnly() {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const user = c.get('user');

    if (!user || user.role !== ROLES.ADMIN) {
      throw new HTTPException(403, { message: ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED });
    }

    await next();
  };
}

// Generate a secure random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomBytes = new Uint8Array(SESSION_CONFIG.TOKEN_LENGTH);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < SESSION_CONFIG.TOKEN_LENGTH; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  return token;
}

// Create session for user
export function createSession(
  db: BetterSQLite3Database<typeof schema>,
  userId: number,
  expiresInHours: number = SESSION_CONFIG.DEFAULT_EXPIRY_HOURS,
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

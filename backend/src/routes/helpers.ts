import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { AuthUser, AuthVariables } from '../middleware/auth.js';
import type * as schema from '../db/schema.js';
import { ERROR_MESSAGES, ROLES } from '../constants.js';

type ParseResult = { success: true; id: number } | { success: false; response: Response };

// Parse ID from route param with validation
export function parseIdParam(
  c: Context<{ Variables: AuthVariables }>,
  param = 'id',
  entityName = 'Resource'
): ParseResult {
  const id = parseInt(c.req.param(param), 10);
  if (isNaN(id)) {
    return { success: false, response: c.json({ error: ERROR_MESSAGES.invalidId(entityName) }, 400) };
  }
  return { success: true, id };
}

// Check seller ownership - returns error response or null if allowed
export function checkSellerAccess(user: AuthUser, sellerId: number) {
  if (user.role === ROLES.SELLER && sellerId !== user.id) {
    return { error: ERROR_MESSAGES.ACCESS_DENIED };
  }
  return null;
}

// Build update values object from partial updates, filtering out undefined values
export function buildUpdateValues<T extends Record<string, unknown>>(
  updates: Partial<T>,
  allowedFields: (keyof T)[]
): Record<string, unknown> {
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateValues[field as string] = updates[field];
    }
  }

  return updateValues;
}

// Entity access check result type
type EntityAccessResult<T> =
  | { success: true; entity: T }
  | { success: false; response: Response };

// Combined helper: parse ID, fetch entity, check 404, check seller access
export function withEntityAccess<T extends { sellerId: number }>(
  c: Context<{ Variables: AuthVariables }>,
  db: BetterSQLite3Database<typeof schema>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  entityName: string
): EntityAccessResult<T> {
  const user = c.get('user');
  const parsed = parseIdParam(c, 'id', entityName);
  if (!parsed.success) {
    return { success: false, response: parsed.response };
  }

  const entity = db.select().from(table).where(eq(table.id, parsed.id)).get() as T | undefined;

  if (!entity) {
    return { success: false, response: c.json({ error: ERROR_MESSAGES.notFound(entityName) }, 404) };
  }

  const accessDenied = checkSellerAccess(user, entity.sellerId);
  if (accessDenied) {
    return { success: false, response: c.json({ error: accessDenied.error }, 403) };
  }

  return { success: true, entity };
}

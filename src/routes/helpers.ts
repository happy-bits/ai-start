import { Context } from 'hono';
import type { AuthUser, AuthVariables } from '../middleware/auth.js';

type ParseResult = { success: true; id: number } | { success: false; response: Response };

// Parse ID from route param with validation
export function parseIdParam(
  c: Context<{ Variables: AuthVariables }>,
  param = 'id',
  entityName = 'Resource'
): ParseResult {
  const id = parseInt(c.req.param(param), 10);
  if (isNaN(id)) {
    return { success: false, response: c.json({ error: `Invalid ${entityName} ID` }, 400) };
  }
  return { success: true, id };
}

// Check seller ownership - returns error response or null if allowed
export function checkSellerAccess(user: AuthUser, sellerId: number) {
  if (user.role === 'seller' && sellerId !== user.id) {
    return { error: 'Access denied' };
  }
  return null;
}

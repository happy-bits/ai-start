import { describe, it, expect, beforeEach } from 'vitest';
import {
  setupTest,
  get,
  post,
  expectOk,
  expectUnauthorized,
  expectBadRequest,
  expectJson,
  type TestContext,
} from './setup.js';
import { ROLES } from '../src/constants.js';

describe('Auth Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const data = await expectOk<{ token: string; user: { email: string; role: string } }>(
        await post(ctx.app, '/auth/login', null, {
          email: 'admin@test.com',
          password: 'password123',
        })
      );
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe('admin@test.com');
      expect(data.user.role).toBe(ROLES.ADMIN);
    });

    it('should reject invalid password', async () => {
      const data = await expectJson<{ error: string }>(
        await post(ctx.app, '/auth/login', null, {
          email: 'admin@test.com',
          password: 'wrongpassword',
        }),
        401
      );
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject non-existent user', async () => {
      await expectUnauthorized(
        await post(ctx.app, '/auth/login', null, {
          email: 'nobody@test.com',
          password: 'password123',
        })
      );
    });

    it('should reject invalid email format', async () => {
      await expectBadRequest(
        await post(ctx.app, '/auth/login', null, {
          email: 'not-an-email',
          password: 'password123',
        })
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const data = await expectOk<{ message: string }>(
        await post(ctx.app, '/auth/logout', ctx.adminToken, {})
      );
      expect(data.message).toBe('Logged out successfully');
    });

    it('should invalidate session after logout', async () => {
      // Logout
      await post(ctx.app, '/auth/logout', ctx.adminToken, {});

      // Try to use the invalidated token
      await expectUnauthorized(await get(ctx.app, '/api/me', ctx.adminToken));
    });
  });

  describe('GET /api/me', () => {
    it('should return current user info', async () => {
      const data = await expectOk<{ user: { email: string; role: string } }>(
        await get(ctx.app, '/api/me', ctx.sellerToken)
      );
      expect(data.user.email).toBe('seller@test.com');
      expect(data.user.role).toBe(ROLES.SELLER);
    });

    it('should reject unauthenticated request', async () => {
      await expectUnauthorized(await ctx.app.request('/api/me'));
    });

    it('should reject invalid token', async () => {
      await expectUnauthorized(await get(ctx.app, '/api/me', 'invalid-token'));
    });
  });
});



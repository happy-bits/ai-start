import { describe, it, expect, beforeEach } from 'vitest';
import { setupTest, get, post, type TestContext } from './setup.js';

describe('Auth Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await post(ctx.app, '/auth/login', null, {
        email: 'admin@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe('admin@test.com');
      expect(data.user.role).toBe('admin');
    });

    it('should reject invalid password', async () => {
      const res = await post(ctx.app, '/auth/login', null, {
        email: 'admin@test.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject non-existent user', async () => {
      const res = await post(ctx.app, '/auth/login', null, {
        email: 'nobody@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });

    it('should reject invalid email format', async () => {
      const res = await post(ctx.app, '/auth/login', null, {
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await post(ctx.app, '/auth/logout', ctx.adminToken, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('Logged out successfully');
    });

    it('should invalidate session after logout', async () => {
      // Logout
      await post(ctx.app, '/auth/logout', ctx.adminToken, {});

      // Try to use the invalidated token
      const res = await get(ctx.app, '/api/me', ctx.adminToken);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/me', () => {
    it('should return current user info', async () => {
      const res = await get(ctx.app, '/api/me', ctx.sellerToken);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.email).toBe('seller@test.com');
      expect(data.user.role).toBe('seller');
    });

    it('should reject unauthenticated request', async () => {
      const res = await ctx.app.request('/api/me');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await get(ctx.app, '/api/me', 'invalid-token');

      expect(res.status).toBe(401);
    });
  });
});



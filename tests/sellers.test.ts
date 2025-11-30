import { describe, it, expect, beforeEach } from 'vitest';
import { setupTest, get, post, put, del, type TestContext } from './setup.js';

describe('Seller Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/sellers', () => {
    it('should list all sellers as admin', async () => {
      const res = await get(ctx.app, '/api/sellers', ctx.adminToken);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sellers).toHaveLength(2);
      expect(data.sellers.map((s: { email: string }) => s.email)).toContain('seller@test.com');
      expect(data.sellers.map((s: { email: string }) => s.email)).toContain('seller2@test.com');
    });

    it('should reject seller access', async () => {
      const res = await get(ctx.app, '/api/sellers', ctx.sellerToken);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated access', async () => {
      const res = await ctx.app.request('/api/sellers');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/sellers/:id', () => {
    it('should get seller details as admin', async () => {
      const res = await get(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.seller.email).toBe('seller@test.com');
      expect(data.seller.name).toBe('Test Seller');
    });

    it('should return 404 for non-existent seller', async () => {
      const res = await get(ctx.app, '/api/sellers/9999', ctx.adminToken);

      expect(res.status).toBe(404);
    });

    it('should return 404 for admin user (not a seller)', async () => {
      const res = await get(ctx.app, `/api/sellers/${ctx.adminId}`, ctx.adminToken);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/sellers', () => {
    it('should create new seller as admin', async () => {
      const res = await post(ctx.app, '/api/sellers', ctx.adminToken, {
        email: 'newseller@test.com',
        password: 'newpassword123',
        name: 'New Seller',
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.seller.email).toBe('newseller@test.com');
      expect(data.seller.name).toBe('New Seller');
      expect(data.seller.role).toBe('seller');
    });

    it('should reject duplicate email', async () => {
      const res = await post(ctx.app, '/api/sellers', ctx.adminToken, {
        email: 'seller@test.com',
        password: 'password123',
        name: 'Duplicate Seller',
      });

      expect(res.status).toBe(409);
    });

    it('should reject short password', async () => {
      const res = await post(ctx.app, '/api/sellers', ctx.adminToken, {
        email: 'newseller@test.com',
        password: '123',
        name: 'New Seller',
      });

      expect(res.status).toBe(400);
    });

    it('should reject seller creating sellers', async () => {
      const res = await post(ctx.app, '/api/sellers', ctx.sellerToken, {
        email: 'newseller@test.com',
        password: 'newpassword123',
        name: 'New Seller',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/sellers/:id', () => {
    it('should update seller as admin', async () => {
      const res = await put(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken, {
        name: 'Updated Seller Name',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.seller.name).toBe('Updated Seller Name');
    });

    it('should update seller email', async () => {
      const res = await put(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken, {
        email: 'updated@test.com',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.seller.email).toBe('updated@test.com');
    });

    it('should reject duplicate email on update', async () => {
      const res = await put(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken, {
        email: 'seller2@test.com',
      });

      expect(res.status).toBe(409);
    });

    it('should return 404 for non-existent seller', async () => {
      const res = await put(ctx.app, '/api/sellers/9999', ctx.adminToken, {
        name: 'Updated',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/sellers/:id', () => {
    it('should delete seller as admin', async () => {
      const res = await del(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken);

      expect(res.status).toBe(200);

      // Verify deleted
      const getRes = await get(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent seller', async () => {
      const res = await del(ctx.app, '/api/sellers/9999', ctx.adminToken);

      expect(res.status).toBe(404);
    });

    it('should reject seller deleting sellers', async () => {
      const res = await del(ctx.app, `/api/sellers/${ctx.seller2Id}`, ctx.sellerToken);

      expect(res.status).toBe(403);
    });
  });
});

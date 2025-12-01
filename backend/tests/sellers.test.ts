import { describe, it, expect, beforeEach } from 'vitest';
import {
  setupTest,
  get,
  post,
  put,
  del,
  expectOk,
  expectCreated,
  expectNotFound,
  expectForbidden,
  expectUnauthorized,
  expectBadRequest,
  expectJson,
  type TestContext,
} from './setup.js';

describe('Seller Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/sellers', () => {
    it('should list all sellers as admin', async () => {
      const data = await expectOk<{ sellers: { email: string }[] }>(
        await get(ctx.app, '/api/sellers', ctx.adminToken)
      );
      expect(data.sellers).toHaveLength(2);
      expect(data.sellers.map((s) => s.email)).toContain('seller@test.com');
      expect(data.sellers.map((s) => s.email)).toContain('seller2@test.com');
    });

    it('should reject seller access', async () => {
      await expectForbidden(await get(ctx.app, '/api/sellers', ctx.sellerToken));
    });

    it('should reject unauthenticated access', async () => {
      await expectUnauthorized(await ctx.app.request('/api/sellers'));
    });
  });

  describe('GET /api/sellers/:id', () => {
    it('should get seller details as admin', async () => {
      const data = await expectOk<{ seller: { email: string; name: string } }>(
        await get(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken)
      );
      expect(data.seller.email).toBe('seller@test.com');
      expect(data.seller.name).toBe('Test Seller');
    });

    it('should return 404 for non-existent seller', async () => {
      await expectNotFound(await get(ctx.app, '/api/sellers/9999', ctx.adminToken));
    });

    it('should return 404 for admin user (not a seller)', async () => {
      await expectNotFound(await get(ctx.app, `/api/sellers/${ctx.adminId}`, ctx.adminToken));
    });
  });

  describe('POST /api/sellers', () => {
    it('should create new seller as admin', async () => {
      const data = await expectCreated<{ seller: { email: string; name: string; role: string; id: number } }>(
        await post(ctx.app, '/api/sellers', ctx.adminToken, {
          email: 'newseller@test.com',
          password: 'newpassword123',
          name: 'New Seller',
        })
      );

      const retrieved = await expectOk<{ seller: { email: string; name: string; role: string } }>(
        await get(ctx.app, `/api/sellers/${data.seller.id}`, ctx.adminToken)
      );
      expect(retrieved.seller.email).toBe('newseller@test.com');
      expect(retrieved.seller.name).toBe('New Seller');
      expect(retrieved.seller.role).toBe('seller');
    });

    it('should reject duplicate email', async () => {
      await expectJson(
        await post(ctx.app, '/api/sellers', ctx.adminToken, {
          email: 'seller@test.com',
          password: 'password123',
          name: 'Duplicate Seller',
        }),
        409
      );
    });

    it('should reject short password', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/sellers', ctx.adminToken, {
          email: 'newseller@test.com',
          password: '123',
          name: 'New Seller',
        })
      );
    });

    it('should reject seller creating sellers', async () => {
      await expectForbidden(
        await post(ctx.app, '/api/sellers', ctx.sellerToken, {
          email: 'newseller@test.com',
          password: 'newpassword123',
          name: 'New Seller',
        })
      );
    });
  });

  describe('PUT /api/sellers/:id', () => {
    it('should update seller as admin', async () => {
      const data = await expectOk<{ seller: { name: string } }>(
        await put(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken, {
          name: 'Updated Seller Name',
        })
      );

      const retrieved = await expectOk<{ seller: { name: string } }>(
        await get(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken)
      );
      expect(retrieved.seller.name).toBe('Updated Seller Name');
    });

    it('should update seller email', async () => {
      const data = await expectOk<{ seller: { email: string } }>(
        await put(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken, {
          email: 'updated@test.com',
        })
      );

      const retrieved = await expectOk<{ seller: { email: string } }>(
        await get(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken)
      );
      expect(retrieved.seller.email).toBe('updated@test.com');
    });

    it('should reject duplicate email on update', async () => {
      await expectJson(
        await put(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken, {
          email: 'seller2@test.com',
        }),
        409
      );
    });

    it('should return 404 for non-existent seller', async () => {
      await expectNotFound(
        await put(ctx.app, '/api/sellers/9999', ctx.adminToken, {
          name: 'Updated',
        })
      );
    });
  });

  describe('DELETE /api/sellers/:id', () => {
    it('should delete seller as admin', async () => {
      await expectOk(await del(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken));

      await expectNotFound(await get(ctx.app, `/api/sellers/${ctx.sellerId}`, ctx.adminToken));
    });

    it('should return 404 for non-existent seller', async () => {
      await expectNotFound(await del(ctx.app, '/api/sellers/9999', ctx.adminToken));
    });

    it('should reject seller deleting sellers', async () => {
      await expectForbidden(await del(ctx.app, `/api/sellers/${ctx.seller2Id}`, ctx.sellerToken));
    });
  });
});

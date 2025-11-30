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
  expectBadRequest,
  type TestContext,
} from './setup.js';

describe('Customer Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/customers', () => {
    it('should list own customers as seller', async () => {
      const data = await expectOk<{ customers: { name: string }[] }>(
        await get(ctx.app, '/api/customers', ctx.sellerToken)
      );
      expect(data.customers).toHaveLength(1);
      expect(data.customers[0].name).toBe('Test Customer');
    });

    it('should list all customers as admin', async () => {
      const data = await expectOk<{ customers: unknown[] }>(
        await get(ctx.app, '/api/customers', ctx.adminToken)
      );
      expect(data.customers).toHaveLength(2);
    });

    it('should not see other sellers customers', async () => {
      const data = await expectOk<{ customers: { name: string }[] }>(
        await get(ctx.app, '/api/customers', ctx.seller2Token)
      );
      expect(data.customers).toHaveLength(1);
      expect(data.customers[0].name).toBe('Other Customer');
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get own customer details', async () => {
      const data = await expectOk<{ customer: { name: string; email: string } }>(
        await get(ctx.app, `/api/customers/${ctx.customerId}`, ctx.sellerToken)
      );
      expect(data.customer.name).toBe('Test Customer');
      expect(data.customer.email).toBe('customer@test.com');
    });

    it('should get any customer as admin', async () => {
      const data = await expectOk<{ customer: { name: string } }>(
        await get(ctx.app, `/api/customers/${ctx.customerId}`, ctx.adminToken)
      );
      expect(data.customer.name).toBe('Test Customer');
    });

    it('should deny access to other sellers customer', async () => {
      await expectForbidden(await get(ctx.app, `/api/customers/${ctx.customerId}`, ctx.seller2Token));
    });

    it('should return 404 for non-existent customer', async () => {
      await expectNotFound(await get(ctx.app, '/api/customers/9999', ctx.sellerToken));
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer as seller', async () => {
      const data = await expectCreated<{ customer: { name: string; sellerId: number } }>(
        await post(ctx.app, '/api/customers', ctx.sellerToken, {
          name: 'New Customer',
          email: 'new@customer.com',
          phone: '+1-555-1234',
          company: 'New Corp',
          notes: 'New notes',
        })
      );
      expect(data.customer.name).toBe('New Customer');
      expect(data.customer.sellerId).toBe(ctx.sellerId);
    });

    it('should create customer with minimal data', async () => {
      const data = await expectCreated<{ customer: { name: string; email: string | null } }>(
        await post(ctx.app, '/api/customers', ctx.sellerToken, {
          name: 'Minimal Customer',
        })
      );
      expect(data.customer.name).toBe('Minimal Customer');
      expect(data.customer.email).toBeNull();
    });

    it('should reject missing name', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/customers', ctx.sellerToken, {
          email: 'no-name@test.com',
        })
      );
    });

    it('should reject invalid email format', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/customers', ctx.sellerToken, {
          name: 'Bad Email Customer',
          email: 'not-an-email',
        })
      );
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update own customer', async () => {
      const data = await expectOk<{ customer: { name: string; notes: string } }>(
        await put(ctx.app, `/api/customers/${ctx.customerId}`, ctx.sellerToken, {
          name: 'Updated Customer',
          notes: 'Updated notes',
        })
      );
      expect(data.customer.name).toBe('Updated Customer');
      expect(data.customer.notes).toBe('Updated notes');
    });

    it('should update any customer as admin', async () => {
      const data = await expectOk<{ customer: { company: string } }>(
        await put(ctx.app, `/api/customers/${ctx.customerId}`, ctx.adminToken, {
          company: 'Admin Updated Corp',
        })
      );
      expect(data.customer.company).toBe('Admin Updated Corp');
    });

    it('should deny update of other sellers customer', async () => {
      await expectForbidden(
        await put(ctx.app, `/api/customers/${ctx.customerId}`, ctx.seller2Token, {
          name: 'Hacked',
        })
      );
    });

    it('should return 404 for non-existent customer', async () => {
      await expectNotFound(
        await put(ctx.app, '/api/customers/9999', ctx.sellerToken, {
          name: 'Updated',
        })
      );
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete own customer', async () => {
      await expectOk(await del(ctx.app, `/api/customers/${ctx.customerId}`, ctx.sellerToken));

      // Verify deleted
      await expectNotFound(await get(ctx.app, `/api/customers/${ctx.customerId}`, ctx.sellerToken));
    });

    it('should delete any customer as admin', async () => {
      await expectOk(await del(ctx.app, `/api/customers/${ctx.customer2Id}`, ctx.adminToken));
    });

    it('should deny delete of other sellers customer', async () => {
      await expectForbidden(await del(ctx.app, `/api/customers/${ctx.customerId}`, ctx.seller2Token));
    });

    it('should return 404 for non-existent customer', async () => {
      await expectNotFound(await del(ctx.app, '/api/customers/9999', ctx.sellerToken));
    });
  });
});

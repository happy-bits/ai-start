import { describe, it, expect, beforeEach } from 'vitest';
import { setupTest, authHeader, type TestContext } from './setup.js';

describe('Customer Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/customers', () => {
    it('should list own customers as seller', async () => {
      const res = await ctx.app.request('/api/customers', {
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customers).toHaveLength(1);
      expect(data.customers[0].name).toBe('Test Customer');
    });

    it('should list all customers as admin', async () => {
      const res = await ctx.app.request('/api/customers', {
        headers: authHeader(ctx.adminToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customers).toHaveLength(2);
    });

    it('should not see other sellers customers', async () => {
      const res = await ctx.app.request('/api/customers', {
        headers: authHeader(ctx.seller2Token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customers).toHaveLength(1);
      expect(data.customers[0].name).toBe('Other Customer');
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get own customer details', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customer.name).toBe('Test Customer');
      expect(data.customer.email).toBe('customer@test.com');
    });

    it('should get any customer as admin', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        headers: authHeader(ctx.adminToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customer.name).toBe('Test Customer');
    });

    it('should deny access to other sellers customer', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        headers: authHeader(ctx.seller2Token),
      });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await ctx.app.request('/api/customers/9999', {
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer as seller', async () => {
      const res = await ctx.app.request('/api/customers', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Customer',
          email: 'new@customer.com',
          phone: '+1-555-1234',
          company: 'New Corp',
          notes: 'New notes',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.customer.name).toBe('New Customer');
      expect(data.customer.sellerId).toBe(ctx.sellerId);
    });

    it('should create customer with minimal data', async () => {
      const res = await ctx.app.request('/api/customers', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Minimal Customer',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.customer.name).toBe('Minimal Customer');
      expect(data.customer.email).toBeNull();
    });

    it('should reject missing name', async () => {
      const res = await ctx.app.request('/api/customers', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'no-name@test.com',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const res = await ctx.app.request('/api/customers', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Bad Email Customer',
          email: 'not-an-email',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update own customer', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Customer',
          notes: 'Updated notes',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customer.name).toBe('Updated Customer');
      expect(data.customer.notes).toBe('Updated notes');
    });

    it('should update any customer as admin', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.adminToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: 'Admin Updated Corp',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customer.company).toBe('Admin Updated Corp');
    });

    it('should deny update of other sellers customer', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.seller2Token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Hacked',
        }),
      });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await ctx.app.request('/api/customers/9999', {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete own customer', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        method: 'DELETE',
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(200);

      // Verify deleted
      const getRes = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        headers: authHeader(ctx.sellerToken),
      });
      expect(getRes.status).toBe(404);
    });

    it('should delete any customer as admin', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customer2Id}`, {
        method: 'DELETE',
        headers: authHeader(ctx.adminToken),
      });

      expect(res.status).toBe(200);
    });

    it('should deny delete of other sellers customer', async () => {
      const res = await ctx.app.request(`/api/customers/${ctx.customerId}`, {
        method: 'DELETE',
        headers: authHeader(ctx.seller2Token),
      });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await ctx.app.request('/api/customers/9999', {
        method: 'DELETE',
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(404);
    });
  });
});


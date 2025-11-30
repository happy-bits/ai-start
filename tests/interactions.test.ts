import { describe, it, expect, beforeEach } from 'vitest';
import { setupTest, authHeader, type TestContext } from './setup.js';

describe('Interaction Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/interactions', () => {
    it('should list own interactions as seller', async () => {
      const res = await ctx.app.request('/api/interactions', {
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.interactions).toHaveLength(1);
      expect(data.interactions[0].type).toBe('call');
    });

    it('should list all interactions as admin', async () => {
      const res = await ctx.app.request('/api/interactions', {
        headers: authHeader(ctx.adminToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.interactions).toHaveLength(1);
    });

    it('should filter by customerId', async () => {
      const res = await ctx.app.request(`/api/interactions?customerId=${ctx.customerId}`, {
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.interactions).toHaveLength(1);
      expect(data.interactions[0].customerId).toBe(ctx.customerId);
    });

    it('should return empty for other sellers customer', async () => {
      const res = await ctx.app.request(`/api/interactions?customerId=${ctx.customerId}`, {
        headers: authHeader(ctx.seller2Token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.interactions).toHaveLength(0);
    });
  });

  describe('GET /api/interactions/:id', () => {
    it('should get own interaction details', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.interaction.type).toBe('call');
      expect(data.interaction.date).toBe('2024-01-10');
    });

    it('should get any interaction as admin', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        headers: authHeader(ctx.adminToken),
      });

      expect(res.status).toBe(200);
    });

    it('should deny access to other sellers interaction', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        headers: authHeader(ctx.seller2Token),
      });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent interaction', async () => {
      const res = await ctx.app.request('/api/interactions/9999', {
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/interactions', () => {
    it('should create interaction for own customer', async () => {
      const res = await ctx.app.request('/api/interactions', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: ctx.customerId,
          type: 'meeting',
          date: '2024-01-20',
          time: '14:30',
          notes: 'Follow-up meeting',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.interaction.type).toBe('meeting');
      expect(data.interaction.date).toBe('2024-01-20');
      expect(data.interaction.sellerId).toBe(ctx.sellerId);
    });

    it('should create interaction with minimal data', async () => {
      const res = await ctx.app.request('/api/interactions', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: ctx.customerId,
          type: 'email',
          date: '2024-01-21',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.interaction.type).toBe('email');
      expect(data.interaction.time).toBeNull();
      expect(data.interaction.notes).toBeNull();
    });

    it('should reject interaction for other sellers customer', async () => {
      const res = await ctx.app.request('/api/interactions', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.seller2Token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: ctx.customerId,
          type: 'call',
          date: '2024-01-22',
        }),
      });

      expect(res.status).toBe(403);
    });

    it('should reject invalid interaction type', async () => {
      const res = await ctx.app.request('/api/interactions', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: ctx.customerId,
          type: 'invalid',
          date: '2024-01-22',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject invalid date format', async () => {
      const res = await ctx.app.request('/api/interactions', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: ctx.customerId,
          type: 'call',
          date: '01-22-2024',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject non-existent customer', async () => {
      const res = await ctx.app.request('/api/interactions', {
        method: 'POST',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: 9999,
          type: 'call',
          date: '2024-01-22',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/interactions/:id', () => {
    it('should update own interaction', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meeting',
          notes: 'Changed to meeting',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.interaction.type).toBe('meeting');
      expect(data.interaction.notes).toBe('Changed to meeting');
    });

    it('should update any interaction as admin', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.adminToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Admin updated',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.interaction.notes).toBe('Admin updated');
    });

    it('should deny update of other sellers interaction', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.seller2Token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Hacked',
        }),
      });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent interaction', async () => {
      const res = await ctx.app.request('/api/interactions/9999', {
        method: 'PUT',
        headers: {
          ...authHeader(ctx.sellerToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Updated',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/interactions/:id', () => {
    it('should delete own interaction', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        method: 'DELETE',
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(200);

      // Verify deleted
      const getRes = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        headers: authHeader(ctx.sellerToken),
      });
      expect(getRes.status).toBe(404);
    });

    it('should delete any interaction as admin', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        method: 'DELETE',
        headers: authHeader(ctx.adminToken),
      });

      expect(res.status).toBe(200);
    });

    it('should deny delete of other sellers interaction', async () => {
      const res = await ctx.app.request(`/api/interactions/${ctx.interactionId}`, {
        method: 'DELETE',
        headers: authHeader(ctx.seller2Token),
      });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent interaction', async () => {
      const res = await ctx.app.request('/api/interactions/9999', {
        method: 'DELETE',
        headers: authHeader(ctx.sellerToken),
      });

      expect(res.status).toBe(404);
    });
  });
});


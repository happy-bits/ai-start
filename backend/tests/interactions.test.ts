import { beforeEach, describe, expect, it } from 'vitest';
import {
  del,
  expectBadRequest,
  expectCreated,
  expectForbidden,
  expectNotFound,
  expectOk,
  get,
  post,
  put,
  setupTest,
  type TestContext,
} from './setup.js';

describe('Interaction Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/interactions', () => {
    it('should list own interactions as seller', async () => {
      const data = await expectOk<{ interactions: { type: string }[] }>(
        await get(ctx.app, '/api/interactions', ctx.sellerToken),
      );
      expect(data.interactions).toHaveLength(1);
      expect(data.interactions[0].type).toBe('call');
    });

    it('should list all interactions as admin', async () => {
      const data = await expectOk<{ interactions: unknown[] }>(
        await get(ctx.app, '/api/interactions', ctx.adminToken),
      );
      expect(data.interactions).toHaveLength(1);
    });

    it('should filter by contactId', async () => {
      const data = await expectOk<{ interactions: { contactId: number }[] }>(
        await get(ctx.app, `/api/interactions?contactId=${ctx.contactId}`, ctx.sellerToken),
      );
      expect(data.interactions).toHaveLength(1);
      expect(data.interactions[0].contactId).toBe(ctx.contactId);
    });

    it('should return empty for other sellers contact', async () => {
      const data = await expectOk<{ interactions: unknown[] }>(
        await get(ctx.app, `/api/interactions?contactId=${ctx.contactId}`, ctx.seller2Token),
      );
      expect(data.interactions).toHaveLength(0);
    });
  });

  describe('GET /api/interactions/:id', () => {
    it('should get own interaction details', async () => {
      const data = await expectOk<{ interaction: { type: string; date: string } }>(
        await get(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.sellerToken),
      );
      expect(data.interaction.type).toBe('call');
      expect(data.interaction.date).toBe('2024-01-10');
    });

    it('should get any interaction as admin', async () => {
      await expectOk(await get(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.adminToken));
    });

    it('should deny access to other sellers interaction', async () => {
      await expectForbidden(
        await get(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.seller2Token),
      );
    });

    it('should return 404 for non-existent interaction', async () => {
      await expectNotFound(await get(ctx.app, '/api/interactions/9999', ctx.sellerToken));
    });
  });

  describe('POST /api/interactions', () => {
    it('should create interaction for own contact', async () => {
      const data = await expectCreated<{
        interaction: { type: string; date: string; sellerId: number; id: number };
      }>(
        await post(ctx.app, '/api/interactions', ctx.sellerToken, {
          contactId: ctx.contactId,
          type: 'meeting',
          date: '2024-01-20',
          time: '14:30',
          notes: 'Follow-up meeting',
        }),
      );

      const retrieved = await expectOk<{
        interaction: { type: string; date: string; sellerId: number };
      }>(await get(ctx.app, `/api/interactions/${data.interaction.id}`, ctx.sellerToken));
      expect(retrieved.interaction.type).toBe('meeting');
      expect(retrieved.interaction.date).toBe('2024-01-20');
      expect(retrieved.interaction.sellerId).toBe(ctx.sellerId);
    });

    it('should create interaction with minimal data', async () => {
      const data = await expectCreated<{
        interaction: { type: string; time: string | null; notes: string | null; id: number };
      }>(
        await post(ctx.app, '/api/interactions', ctx.sellerToken, {
          contactId: ctx.contactId,
          type: 'email',
          date: '2024-01-21',
        }),
      );

      const retrieved = await expectOk<{
        interaction: { type: string; time: string | null; notes: string | null };
      }>(await get(ctx.app, `/api/interactions/${data.interaction.id}`, ctx.sellerToken));
      expect(retrieved.interaction.type).toBe('email');
      expect(retrieved.interaction.time).toBeNull();
      expect(retrieved.interaction.notes).toBeNull();
    });

    it('should reject interaction for other sellers contact', async () => {
      await expectForbidden(
        await post(ctx.app, '/api/interactions', ctx.seller2Token, {
          contactId: ctx.contactId,
          type: 'call',
          date: '2024-01-22',
        }),
      );
    });

    it('should reject invalid interaction type', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/interactions', ctx.sellerToken, {
          contactId: ctx.contactId,
          type: 'invalid',
          date: '2024-01-22',
        }),
      );
    });

    it('should reject invalid date format', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/interactions', ctx.sellerToken, {
          contactId: ctx.contactId,
          type: 'call',
          date: '01-22-2024',
        }),
      );
    });

    it('should reject non-existent contact', async () => {
      await expectNotFound(
        await post(ctx.app, '/api/interactions', ctx.sellerToken, {
          contactId: 9999,
          type: 'call',
          date: '2024-01-22',
        }),
      );
    });

    it('should reject interaction for soft-deleted contact', async () => {
      // Soft-delete the contact via API (DELETE /contacts/:id)
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));

      await expectNotFound(
        await post(ctx.app, '/api/interactions', ctx.sellerToken, {
          contactId: ctx.contactId,
          type: 'call',
          date: '2024-01-22',
        }),
      );
    });
  });

  describe('PUT /api/interactions/:id', () => {
    it('should update own interaction', async () => {
      const _data = await expectOk<{ interaction: { type: string; notes: string } }>(
        await put(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.sellerToken, {
          type: 'meeting',
          notes: 'Changed to meeting',
        }),
      );

      const retrieved = await expectOk<{ interaction: { type: string; notes: string } }>(
        await get(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.sellerToken),
      );
      expect(retrieved.interaction.type).toBe('meeting');
      expect(retrieved.interaction.notes).toBe('Changed to meeting');
    });

    it('should update any interaction as admin', async () => {
      const _data = await expectOk<{ interaction: { notes: string } }>(
        await put(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.adminToken, {
          notes: 'Admin updated',
        }),
      );

      const retrieved = await expectOk<{ interaction: { notes: string } }>(
        await get(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.adminToken),
      );
      expect(retrieved.interaction.notes).toBe('Admin updated');
    });

    it('should deny update of other sellers interaction', async () => {
      await expectForbidden(
        await put(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.seller2Token, {
          notes: 'Hacked',
        }),
      );
    });

    it('should return 404 for non-existent interaction', async () => {
      await expectNotFound(
        await put(ctx.app, '/api/interactions/9999', ctx.sellerToken, {
          notes: 'Updated',
        }),
      );
    });
  });

  describe('DELETE /api/interactions/:id', () => {
    it('should delete own interaction', async () => {
      await expectOk(await del(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.sellerToken));

      await expectNotFound(
        await get(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.sellerToken),
      );
    });

    it('should delete any interaction as admin', async () => {
      await expectOk(await del(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.adminToken));
    });

    it('should deny delete of other sellers interaction', async () => {
      await expectForbidden(
        await del(ctx.app, `/api/interactions/${ctx.interactionId}`, ctx.seller2Token),
      );
    });

    it('should return 404 for non-existent interaction', async () => {
      await expectNotFound(await del(ctx.app, '/api/interactions/9999', ctx.sellerToken));
    });
  });
});

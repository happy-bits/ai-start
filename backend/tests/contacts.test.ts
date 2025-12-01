import { describe, it, expect, beforeEach } from 'vitest';
import {
  setupTest,
  get,
  post,
  del,
  expectOk,
  expectCreated,
  expectNotFound,
  expectForbidden,
  expectBadRequest,
  type TestContext,
} from './setup.js';

describe('Contact Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/contacts', () => {
    it('should list own contacts as seller', async () => {
      const data = await expectOk<{ contacts: { name: string }[] }>(
        await get(ctx.app, '/api/contacts', ctx.sellerToken)
      );
      expect(data.contacts).toHaveLength(1);
      expect(data.contacts[0].name).toBe('Test Contact');
    });

    it('should list all contacts as admin', async () => {
      const data = await expectOk<{ contacts: unknown[] }>(
        await get(ctx.app, '/api/contacts', ctx.adminToken)
      );
      expect(data.contacts).toHaveLength(2);
    });

    it('should not see other sellers contacts', async () => {
      const data = await expectOk<{ contacts: { name: string }[] }>(
        await get(ctx.app, '/api/contacts', ctx.seller2Token)
      );
      expect(data.contacts).toHaveLength(1);
      expect(data.contacts[0].name).toBe('Other Contact');
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should get own contact details', async () => {
      const data = await expectOk<{ contact: { name: string; email: string } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken)
      );
      expect(data.contact.name).toBe('Test Contact');
      expect(data.contact.email).toBe('contact@test.com');
    });

    it('should get any contact as admin', async () => {
      const data = await expectOk<{ contact: { name: string } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.adminToken)
      );
      expect(data.contact.name).toBe('Test Contact');
    });

    it('should deny access to other sellers contact', async () => {
      await expectForbidden(await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.seller2Token));
    });

    it('should return 404 for non-existent contact', async () => {
      await expectNotFound(await get(ctx.app, '/api/contacts/9999', ctx.sellerToken));
    });
  });

  describe('POST /api/contacts', () => {
    it('should create contact as seller', async () => {
      const data = await expectCreated<{ contact: { name: string; sellerId: number; id: number } }>(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'New Contact',
          email: 'new@contact.com',
          company: 'New Corp',
        })
      );

      const retrieved = await expectOk<{ contact: { name: string; sellerId: number } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken)
      );
      expect(retrieved.contact.name).toBe('New Contact');
      expect(retrieved.contact.sellerId).toBe(ctx.sellerId);
    });

    it('should create contact with minimal data', async () => {
      const data = await expectCreated<{ contact: { name: string; email: string | null; id: number } }>(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'Minimal Contact',
        })
      );

      const retrieved = await expectOk<{ contact: { name: string; email: string | null } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken)
      );
      expect(retrieved.contact.name).toBe('Minimal Contact');
      expect(retrieved.contact.email).toBeNull();
    });

    it('should reject missing name', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          email: 'no-name@test.com',
        })
      );
    });

    it('should reject invalid email format', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'Bad Email Contact',
          email: 'not-an-email',
        })
      );
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete own contact', async () => {
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));

      // Verify deleted
      await expectNotFound(await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));
    });

    it('should delete any contact as admin', async () => {
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.adminToken));
    });

    it('should deny delete of other sellers contact', async () => {
      await expectForbidden(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.seller2Token));
    });

    it('should return 404 for non-existent contact', async () => {
      await expectNotFound(await del(ctx.app, '/api/contacts/9999', ctx.sellerToken));
    });
  });
});


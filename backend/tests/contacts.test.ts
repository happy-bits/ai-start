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

describe('Contact Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('GET /api/contacts', () => {
    it('should list own contacts as seller', async () => {
      const data = await expectOk<{ contacts: { name: string }[] }>(
        await get(ctx.app, '/api/contacts', ctx.sellerToken),
      );
      expect(data.contacts).toHaveLength(1);
      expect(data.contacts[0].name).toBe('Test Contact');
    });

    it('should list all contacts as admin', async () => {
      const data = await expectOk<{ contacts: unknown[] }>(
        await get(ctx.app, '/api/contacts', ctx.adminToken),
      );
      expect(data.contacts).toHaveLength(2);
    });

    it('should not see other sellers contacts', async () => {
      const data = await expectOk<{ contacts: { name: string }[] }>(
        await get(ctx.app, '/api/contacts', ctx.seller2Token),
      );
      expect(data.contacts).toHaveLength(1);
      expect(data.contacts[0].name).toBe('Other Contact');
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should get own contact details', async () => {
      const data = await expectOk<{ contact: { name: string; email: string } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken),
      );
      expect(data.contact.name).toBe('Test Contact');
      expect(data.contact.email).toBe('contact@test.com');
    });

    it('should get any contact as admin', async () => {
      const data = await expectOk<{ contact: { name: string } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.adminToken),
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
          phone: '+1-555-1234',
          company: 'New Corp',
        }),
      );

      const retrieved = await expectOk<{ contact: { name: string; sellerId: number } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken),
      );
      expect(retrieved.contact.name).toBe('New Contact');
      expect(retrieved.contact.sellerId).toBe(ctx.sellerId);
    });

    it('should create contact with minimal data', async () => {
      const data = await expectCreated<{
        contact: { name: string; email: string | null; id: number };
      }>(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'Minimal Contact',
        }),
      );

      const retrieved = await expectOk<{ contact: { name: string; email: string | null } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken),
      );
      expect(retrieved.contact.name).toBe('Minimal Contact');
      expect(retrieved.contact.email).toBeNull();
    });

    it('should reject missing name', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          email: 'no-name@test.com',
        }),
      );
    });

    it('should reject invalid email format', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'Bad Email Contact',
          email: 'not-an-email',
        }),
      );
    });

    it('should create contact with followUpDate', async () => {
      const data = await expectCreated<{
        contact: { name: string; followUpDate: string | null; id: number };
      }>(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'Contact With Follow Up',
          followUpDate: '2024-12-31',
        }),
      );

      const retrieved = await expectOk<{ contact: { name: string; followUpDate: string | null } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken),
      );
      expect(retrieved.contact.name).toBe('Contact With Follow Up');
      expect(retrieved.contact.followUpDate).toBe('2024-12-31');
    });

    it('should create contact without followUpDate (should be null)', async () => {
      const data = await expectCreated<{
        contact: { name: string; followUpDate: string | null; id: number };
      }>(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'Contact Without Follow Up',
        }),
      );

      const retrieved = await expectOk<{ contact: { name: string; followUpDate: string | null } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken),
      );
      expect(retrieved.contact.name).toBe('Contact Without Follow Up');
      expect(retrieved.contact.followUpDate).toBeNull();
    });

    it('should reject invalid followUpDate format', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'Bad Date Contact',
          followUpDate: '2024/12/31',
        }),
      );
    });

    it('should create contact with LinkedIn username and store as username only', async () => {
      const data = await expectCreated<{
        contact: { name: string; linkedin: string | null; id: number };
      }>(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'LinkedIn Contact',
          linkedin: 'jane-doe',
        }),
      );

      const retrieved = await expectOk<{ contact: { name: string; linkedin: string | null } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken),
      );
      expect(retrieved.contact.name).toBe('LinkedIn Contact');
      expect(retrieved.contact.linkedin).toBe('jane-doe');
    });

    it('should normalize full LinkedIn URL to username on create', async () => {
      const data = await expectCreated<{
        contact: { name: string; linkedin: string | null; id: number };
      }>(
        await post(ctx.app, '/api/contacts', ctx.sellerToken, {
          name: 'URL LinkedIn Contact',
          linkedin: 'https://www.linkedin.com/in/john-smith/',
        }),
      );

      const retrieved = await expectOk<{ contact: { name: string; linkedin: string | null } }>(
        await get(ctx.app, `/api/contacts/${data.contact.id}`, ctx.sellerToken),
      );
      expect(retrieved.contact.linkedin).toBe('john-smith');
    });
  });

  describe('POST /api/contacts/bulk', () => {
    it('should create multiple contacts as seller', async () => {
      const data = await expectCreated<{
        contacts: { name: string; sellerId: number; id: number }[];
      }>(
        await post(ctx.app, '/api/contacts/bulk', ctx.sellerToken, {
          contacts: [
            { name: 'Bulk Contact 1', email: 'bulk1@test.com' },
            { name: 'Bulk Contact 2', company: 'Bulk Corp' },
          ],
        }),
      );

      expect(data.contacts).toHaveLength(2);
      expect(data.contacts[0].name).toBe('Bulk Contact 1');
      expect(data.contacts[0].sellerId).toBe(ctx.sellerId);
      expect(data.contacts[1].name).toBe('Bulk Contact 2');
      expect(data.contacts[1].sellerId).toBe(ctx.sellerId);

      const list = await expectOk<{ contacts: { name: string }[] }>(
        await get(ctx.app, '/api/contacts', ctx.sellerToken),
      );
      expect(list.contacts.map((c) => c.name)).toContain('Bulk Contact 1');
      expect(list.contacts.map((c) => c.name)).toContain('Bulk Contact 2');
    });

    it('should reject when any contact has invalid data (all-or-nothing)', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts/bulk', ctx.sellerToken, {
          contacts: [
            { name: 'Valid Contact', email: 'valid@test.com' },
            { email: 'no-name@test.com' },
          ],
        }),
      );

      const list = await expectOk<{ contacts: { name: string }[] }>(
        await get(ctx.app, '/api/contacts', ctx.sellerToken),
      );
      expect(list.contacts.map((c) => c.name)).not.toContain('Valid Contact');
    });

    it('should reject when any contact has invalid email', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts/bulk', ctx.sellerToken, {
          contacts: [{ name: 'Valid Contact' }, { name: 'Bad Email', email: 'not-an-email' }],
        }),
      );
    });

    it('should reject empty contacts array', async () => {
      await expectBadRequest(
        await post(ctx.app, '/api/contacts/bulk', ctx.sellerToken, {
          contacts: [],
        }),
      );
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update own contact', async () => {
      await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken, {
        name: 'Updated Contact',
        company: 'Updated Company',
      });

      const retrieved = await expectOk<{ contact: { name: string; company: string } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken),
      );
      expect(retrieved.contact.name).toBe('Updated Contact');
      expect(retrieved.contact.company).toBe('Updated Company');
    });

    it('should update any contact as admin', async () => {
      await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.adminToken, {
        company: 'Admin Updated Corp',
      });

      const retrieved = await expectOk<{ contact: { company: string } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.adminToken),
      );
      expect(retrieved.contact.company).toBe('Admin Updated Corp');
    });

    it('should deny update of other sellers contact', async () => {
      await expectForbidden(
        await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.seller2Token, {
          name: 'Hacked',
        }),
      );
    });

    it('should return 404 for non-existent contact', async () => {
      await expectNotFound(
        await put(ctx.app, '/api/contacts/9999', ctx.sellerToken, {
          name: 'Updated',
        }),
      );
    });

    it('should update followUpDate as seller (own contact)', async () => {
      await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken, {
        followUpDate: '2024-12-25',
      });

      const retrieved = await expectOk<{ contact: { followUpDate: string | null } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken),
      );
      expect(retrieved.contact.followUpDate).toBe('2024-12-25');
    });

    it('should update followUpDate as admin (any contact)', async () => {
      await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.adminToken, {
        followUpDate: '2024-12-30',
      });

      const retrieved = await expectOk<{ contact: { followUpDate: string | null } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.adminToken),
      );
      expect(retrieved.contact.followUpDate).toBe('2024-12-30');
    });

    it('should deny update of followUpDate for other sellers contact', async () => {
      await expectForbidden(
        await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.seller2Token, {
          followUpDate: '2024-12-31',
        }),
      );
    });

    it('should allow setting followUpDate to null', async () => {
      // First set a followUpDate
      await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken, {
        followUpDate: '2024-12-25',
      });

      // Then set it to null
      await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken, {
        followUpDate: null,
      });

      const retrieved = await expectOk<{ contact: { followUpDate: string | null } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken),
      );
      expect(retrieved.contact.followUpDate).toBeNull();
    });

    it('should reject invalid followUpDate format on update', async () => {
      await expectBadRequest(
        await put(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken, {
          followUpDate: 'invalid-date',
        }),
      );
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should soft delete own contact', async () => {
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));

      // Verify contact is soft-deleted (not in regular list)
      const regularList = await expectOk<{ contacts: { id: number }[] }>(
        await get(ctx.app, '/api/contacts', ctx.sellerToken),
      );
      expect(regularList.contacts.find((c) => c.id === ctx.contactId)).toBeUndefined();

      // Verify contact appears in wastebin
      const wastebin = await expectOk<{ contacts: { id: number; deletedAt: string | null }[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.sellerToken),
      );
      const deletedContact = wastebin.contacts.find((c) => c.id === ctx.contactId);
      expect(deletedContact).toBeDefined();
      expect(deletedContact?.deletedAt).toBeTruthy();

      // Verify contact cannot be accessed via GET /contacts/:id
      await expectNotFound(await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));
    });

    it('should soft delete any contact as admin', async () => {
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.adminToken));

      // Verify contact appears in wastebin
      const wastebin = await expectOk<{ contacts: { id: number; deletedAt: string | null }[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.adminToken),
      );
      expect(wastebin.contacts.find((c) => c.id === ctx.contact2Id)).toBeDefined();
    });

    it('should deny delete of other sellers contact', async () => {
      await expectForbidden(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.seller2Token));
    });

    it('should return 404 for non-existent contact', async () => {
      await expectNotFound(await del(ctx.app, '/api/contacts/9999', ctx.sellerToken));
    });
  });

  describe('GET /api/contacts/wastebin', () => {
    it('should list own deleted contacts as seller', async () => {
      // First, soft delete a contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));

      const data = await expectOk<{
        contacts: { id: number; name: string; deletedAt: string | null }[];
      }>(await get(ctx.app, '/api/contacts/wastebin', ctx.sellerToken));
      expect(data.contacts).toHaveLength(1);
      expect(data.contacts[0].id).toBe(ctx.contactId);
      expect(data.contacts[0].name).toBe('Test Contact');
      expect(data.contacts[0].deletedAt).toBeTruthy();
    });

    it('should list all deleted contacts as admin', async () => {
      // Soft delete contacts from both sellers
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.seller2Token));

      const data = await expectOk<{ contacts: { id: number }[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.adminToken),
      );
      expect(data.contacts).toHaveLength(2);
      expect(data.contacts.map((c) => c.id)).toContain(ctx.contactId);
      expect(data.contacts.map((c) => c.id)).toContain(ctx.contact2Id);
    });

    it('should not see other sellers deleted contacts', async () => {
      // Seller2 deletes their contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.seller2Token));

      // Seller1 should not see seller2's deleted contact
      const data = await expectOk<{ contacts: { id: number }[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.sellerToken),
      );
      expect(data.contacts).toHaveLength(0);
    });

    it('should return empty list when no deleted contacts', async () => {
      const data = await expectOk<{ contacts: unknown[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.sellerToken),
      );
      expect(data.contacts).toHaveLength(0);
    });
  });

  describe('POST /api/contacts/:id/restore', () => {
    it('should restore own deleted contact', async () => {
      // First, soft delete the contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));

      // Restore the contact
      const data = await expectOk<{
        contact: { id: number; name: string; deletedAt: string | null };
      }>(await post(ctx.app, `/api/contacts/${ctx.contactId}/restore`, ctx.sellerToken, {}));
      expect(data.contact.id).toBe(ctx.contactId);
      expect(data.contact.name).toBe('Test Contact');
      expect(data.contact.deletedAt).toBeNull();

      // Verify contact is back in regular list
      const regularList = await expectOk<{ contacts: { id: number }[] }>(
        await get(ctx.app, '/api/contacts', ctx.sellerToken),
      );
      expect(regularList.contacts.find((c) => c.id === ctx.contactId)).toBeDefined();

      // Verify contact is removed from wastebin
      const wastebin = await expectOk<{ contacts: { id: number }[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.sellerToken),
      );
      expect(wastebin.contacts.find((c) => c.id === ctx.contactId)).toBeUndefined();

      // Verify contact can be accessed via GET /contacts/:id
      const retrieved = await expectOk<{ contact: { id: number; name: string } }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken),
      );
      expect(retrieved.contact.name).toBe('Test Contact');
    });

    it('should restore any deleted contact as admin', async () => {
      // Seller2 deletes their contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.seller2Token));

      // Admin restores it
      const data = await expectOk<{ contact: { id: number; deletedAt: string | null } }>(
        await post(ctx.app, `/api/contacts/${ctx.contact2Id}/restore`, ctx.adminToken, {}),
      );
      expect(data.contact.deletedAt).toBeNull();
    });

    it('should deny restore of other sellers contact', async () => {
      // Seller2 deletes their contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.seller2Token));

      // Seller1 tries to restore seller2's contact
      await expectForbidden(
        await post(ctx.app, `/api/contacts/${ctx.contact2Id}/restore`, ctx.sellerToken, {}),
      );
    });

    it('should return 400 when trying to restore non-deleted contact', async () => {
      // Try to restore a contact that is not deleted
      await expectBadRequest(
        await post(ctx.app, `/api/contacts/${ctx.contactId}/restore`, ctx.sellerToken, {}),
      );
    });

    it('should return 404 for non-existent contact', async () => {
      await expectNotFound(await post(ctx.app, '/api/contacts/9999/restore', ctx.sellerToken, {}));
    });
  });

  describe('DELETE /api/contacts/:id/permanent', () => {
    it('should permanently delete own deleted contact', async () => {
      // First, soft delete the contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));

      // Verify it's in wastebin
      const wastebinBefore = await expectOk<{ contacts: { id: number }[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.sellerToken),
      );
      expect(wastebinBefore.contacts.find((c) => c.id === ctx.contactId)).toBeDefined();

      // Permanently delete it
      await expectOk(
        await del(ctx.app, `/api/contacts/${ctx.contactId}/permanent`, ctx.sellerToken),
      );

      // Verify it's removed from wastebin
      const wastebinAfter = await expectOk<{ contacts: { id: number }[] }>(
        await get(ctx.app, '/api/contacts/wastebin', ctx.sellerToken),
      );
      expect(wastebinAfter.contacts.find((c) => c.id === ctx.contactId)).toBeUndefined();

      // Verify it's truly gone (404)
      await expectNotFound(await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));
    });

    it('should permanently delete any deleted contact as admin', async () => {
      // Seller2 deletes their contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.seller2Token));

      // Admin permanently deletes it
      await expectOk(
        await del(ctx.app, `/api/contacts/${ctx.contact2Id}/permanent`, ctx.adminToken),
      );

      // Verify it's gone
      await expectNotFound(await get(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.adminToken));
    });

    it('should deny permanent delete of other sellers contact', async () => {
      // Seller2 deletes their contact
      await expectOk(await del(ctx.app, `/api/contacts/${ctx.contact2Id}`, ctx.seller2Token));

      // Seller1 tries to permanently delete seller2's contact
      await expectForbidden(
        await del(ctx.app, `/api/contacts/${ctx.contact2Id}/permanent`, ctx.sellerToken),
      );
    });

    it('should return 404 for non-existent contact', async () => {
      await expectNotFound(await del(ctx.app, '/api/contacts/9999/permanent', ctx.sellerToken));
    });

    it('should permanently delete non-deleted contact (if user has access)', async () => {
      // Permanently delete a contact that hasn't been soft-deleted first
      await expectOk(
        await del(ctx.app, `/api/contacts/${ctx.contactId}/permanent`, ctx.sellerToken),
      );

      // Verify it's gone
      await expectNotFound(await get(ctx.app, `/api/contacts/${ctx.contactId}`, ctx.sellerToken));
    });
  });
});

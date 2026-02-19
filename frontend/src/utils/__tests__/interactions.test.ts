import { describe, expect, it } from 'vitest';
import type { Contact, Interaction } from '../../api/types';
import {
  getLatestInteractionsForContact,
  isFollowUpDue,
  sortContacts,
  sortInteractionsByRecency,
} from '../interactions';

describe('interactions utilities', () => {
  describe('sortInteractionsByRecency', () => {
    it('sorts interactions by date (newest first)', () => {
      const interactions: Interaction[] = [
        {
          id: 1,
          contactId: 1,
          sellerId: 1,
          type: 'call',
          date: '2024-01-01',
          time: null,
          notes: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          contactId: 1,
          sellerId: 1,
          type: 'meeting',
          date: '2024-01-15',
          time: null,
          notes: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 3,
          contactId: 1,
          sellerId: 1,
          type: 'email',
          date: '2024-01-10',
          time: null,
          notes: null,
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
      ];

      const sorted = sortInteractionsByRecency(interactions);
      expect(sorted[0].id).toBe(2); // 2024-01-15 (newest)
      expect(sorted[1].id).toBe(3); // 2024-01-10
      expect(sorted[2].id).toBe(1); // 2024-01-01 (oldest)
    });

    it('sorts by time when dates are equal (newest first)', () => {
      const interactions: Interaction[] = [
        {
          id: 1,
          contactId: 1,
          sellerId: 1,
          type: 'call',
          date: '2024-01-15',
          time: '09:00',
          notes: null,
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
        },
        {
          id: 2,
          contactId: 1,
          sellerId: 1,
          type: 'meeting',
          date: '2024-01-15',
          time: '14:00',
          notes: null,
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
        },
        {
          id: 3,
          contactId: 1,
          sellerId: 1,
          type: 'email',
          date: '2024-01-15',
          time: '11:00',
          notes: null,
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        },
      ];

      const sorted = sortInteractionsByRecency(interactions);
      expect(sorted[0].time).toBe('14:00'); // Latest time
      expect(sorted[1].time).toBe('11:00');
      expect(sorted[2].time).toBe('09:00'); // Earliest time
    });

    it('treats missing time as 00:00 when dates are equal', () => {
      const interactions: Interaction[] = [
        {
          id: 1,
          contactId: 1,
          sellerId: 1,
          type: 'call',
          date: '2024-01-15',
          time: '10:00',
          notes: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          contactId: 1,
          sellerId: 1,
          type: 'meeting',
          date: '2024-01-15',
          time: null,
          notes: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const sorted = sortInteractionsByRecency(interactions);
      expect(sorted[0].time).toBe('10:00'); // Has time, comes first
      expect(sorted[1].time).toBeNull(); // No time, treated as 00:00
    });

    it('sorts by createdAt when date and time are equal', () => {
      const interactions: Interaction[] = [
        {
          id: 1,
          contactId: 1,
          sellerId: 1,
          type: 'call',
          date: '2024-01-15',
          time: '10:00',
          notes: null,
          createdAt: '2024-01-15T08:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          contactId: 1,
          sellerId: 1,
          type: 'meeting',
          date: '2024-01-15',
          time: '10:00',
          notes: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const sorted = sortInteractionsByRecency(interactions);
      expect(sorted[0].id).toBe(2); // Newer createdAt
      expect(sorted[1].id).toBe(1); // Older createdAt
    });

    it('does not mutate the original array', () => {
      const interactions: Interaction[] = [
        {
          id: 1,
          contactId: 1,
          sellerId: 1,
          type: 'call',
          date: '2024-01-15',
          time: null,
          notes: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          contactId: 1,
          sellerId: 1,
          type: 'meeting',
          date: '2024-01-10',
          time: null,
          notes: null,
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
      ];

      const original = [...interactions];
      sortInteractionsByRecency(interactions);
      expect(interactions).toEqual(original);
    });

    it('handles empty array', () => {
      const sorted = sortInteractionsByRecency([]);
      expect(sorted).toEqual([]);
    });

    it('handles single interaction', () => {
      const interactions: Interaction[] = [
        {
          id: 1,
          contactId: 1,
          sellerId: 1,
          type: 'call',
          date: '2024-01-15',
          time: null,
          notes: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const sorted = sortInteractionsByRecency(interactions);
      expect(sorted).toEqual(interactions);
    });
  });

  describe('getLatestInteractionsForContact', () => {
    const allInteractions: Interaction[] = [
      {
        id: 1,
        contactId: 1,
        sellerId: 1,
        type: 'call',
        date: '2024-01-01',
        time: null,
        notes: null,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        contactId: 2,
        sellerId: 1,
        type: 'meeting',
        date: '2024-01-15',
        time: null,
        notes: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 3,
        contactId: 1,
        sellerId: 1,
        type: 'email',
        date: '2024-01-10',
        time: null,
        notes: null,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
      },
      {
        id: 4,
        contactId: 1,
        sellerId: 1,
        type: 'call',
        date: '2024-01-20',
        time: null,
        notes: null,
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      },
    ];

    it('filters interactions by contact ID', () => {
      const result = getLatestInteractionsForContact(allInteractions, 1);
      expect(result.length).toBe(3);
      expect(result.every((i) => i.contactId === 1)).toBe(true);
    });

    it('returns latest interactions first', () => {
      const result = getLatestInteractionsForContact(allInteractions, 1);
      expect(result[0].id).toBe(4); // 2024-01-20 (newest)
      expect(result[1].id).toBe(3); // 2024-01-10
      expect(result[2].id).toBe(1); // 2024-01-01 (oldest)
    });

    it('respects limit parameter', () => {
      const result = getLatestInteractionsForContact(allInteractions, 1, 2);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(4);
      expect(result[1].id).toBe(3);
    });

    it('uses default limit of 3', () => {
      const manyInteractions: Interaction[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        contactId: 1,
        sellerId: 1,
        type: 'call' as const,
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        time: null,
        notes: null,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        updatedAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }));

      const result = getLatestInteractionsForContact(manyInteractions, 1);
      expect(result.length).toBe(3);
    });

    it('returns empty array when contact has no interactions', () => {
      const result = getLatestInteractionsForContact(allInteractions, 999);
      expect(result).toEqual([]);
    });

    it('handles empty interactions array', () => {
      const result = getLatestInteractionsForContact([], 1);
      expect(result).toEqual([]);
    });
  });

  describe('isFollowUpDue', () => {
    it('returns false when followUpDate is null', () => {
      expect(isFollowUpDue(null)).toBe(false);
    });

    it('returns true when followUpDate is today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      expect(isFollowUpDue(todayISO)).toBe(true);
    });

    it('returns true when followUpDate is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayISO = yesterday.toISOString().split('T')[0];
      expect(isFollowUpDue(yesterdayISO)).toBe(true);
    });

    it('returns false when followUpDate is in the future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      // Use local date string to avoid timezone issues
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowISO = `${year}-${month}-${day}`;
      expect(isFollowUpDue(tomorrowISO)).toBe(false);
    });

    it('handles dates at different times of day', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const todayISO = today.toISOString().split('T')[0];
      expect(isFollowUpDue(todayISO)).toBe(true);
    });
  });

  describe('sortContacts', () => {
    it('sorts contacts by follow-up date (earliest first)', () => {
      const contacts: Contact[] = [
        {
          id: 1,
          sellerId: 1,
          name: 'Contact A',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-15',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          sellerId: 1,
          name: 'Contact B',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-10',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 3,
          sellerId: 1,
          name: 'Contact C',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-20',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      ];

      const sorted = sortContacts(contacts);
      expect(sorted[0].id).toBe(2); // 2024-01-10 (earliest)
      expect(sorted[1].id).toBe(1); // 2024-01-15
      expect(sorted[2].id).toBe(3); // 2024-01-20 (latest)
    });

    it('sorts by ID when follow-up dates are equal', () => {
      const contacts: Contact[] = [
        {
          id: 3,
          sellerId: 1,
          name: 'Contact A',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-15',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 1,
          sellerId: 1,
          name: 'Contact B',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-15',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          sellerId: 1,
          name: 'Contact C',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-15',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      ];

      const sorted = sortContacts(contacts);
      expect(sorted[0].id).toBe(1);
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(3);
    });

    it('prioritizes contacts with follow-up dates over those without', () => {
      const contacts: Contact[] = [
        {
          id: 1,
          sellerId: 1,
          name: 'Contact A',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: null,
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          sellerId: 1,
          name: 'Contact B',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-15',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 3,
          sellerId: 1,
          name: 'Contact C',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: null,
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      ];

      const sorted = sortContacts(contacts);
      expect(sorted[0].id).toBe(2); // Has follow-up date, comes first
      expect(sorted[1].id).toBe(1); // No follow-up date, sorted by ID
      expect(sorted[2].id).toBe(3); // No follow-up date, sorted by ID
    });

    it('sorts contacts without follow-up dates by ID', () => {
      const contacts: Contact[] = [
        {
          id: 3,
          sellerId: 1,
          name: 'Contact A',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: null,
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 1,
          sellerId: 1,
          name: 'Contact B',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: null,
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          sellerId: 1,
          name: 'Contact C',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: null,
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      ];

      const sorted = sortContacts(contacts);
      expect(sorted[0].id).toBe(1);
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(3);
    });

    it('does not mutate the original array', () => {
      const contacts: Contact[] = [
        {
          id: 1,
          sellerId: 1,
          name: 'Contact A',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-15',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          sellerId: 1,
          name: 'Contact B',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-10',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      ];

      const original = [...contacts];
      sortContacts(contacts);
      expect(contacts).toEqual(original);
    });

    it('handles empty array', () => {
      const sorted = sortContacts([]);
      expect(sorted).toEqual([]);
    });

    it('handles single contact', () => {
      const contacts: Contact[] = [
        {
          id: 1,
          sellerId: 1,
          name: 'Contact A',
          email: null,
          phone: null,
          company: null,
          linkedin: null,
          followUpDate: '2024-01-15',
          deletedAt: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      ];

      const sorted = sortContacts(contacts);
      expect(sorted).toEqual(contacts);
    });
  });
});

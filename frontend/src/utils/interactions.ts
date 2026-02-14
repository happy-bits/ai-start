import type { Contact, Interaction } from '../api/types';

/**
 * Sort interactions by recency (newest first)
 * Sorts by: date (desc) -> time (desc) -> createdAt (desc)
 */
export function sortInteractionsByRecency(interactions: Interaction[]): Interaction[] {
  return [...interactions].sort((a, b) => {
    // First sort by date (newest first)
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;

    // If dates are equal, sort by time (newest first)
    // If time is missing, treat it as earliest (00:00)
    const aTime = a.time || '00:00';
    const bTime = b.time || '00:00';
    const timeDiff = bTime.localeCompare(aTime);
    if (timeDiff !== 0) return timeDiff;

    // If date and time are equal, sort by createdAt (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Get the latest interactions for a specific contact
 * @param interactions - All interactions
 * @param contactId - The contact ID to filter by
 * @param limit - Maximum number of interactions to return (default: 3)
 */
export function getLatestInteractionsForContact(
  interactions: Interaction[],
  contactId: number,
  limit: number = 3,
): Interaction[] {
  const filtered = interactions.filter((interaction) => interaction.contactId === contactId);
  return sortInteractionsByRecency(filtered).slice(0, limit);
}

/**
 * Check if a follow-up date is today or earlier
 */
export function isFollowUpDue(followUpDate: string | null): boolean {
  if (!followUpDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUp = new Date(followUpDate);
  followUp.setHours(0, 0, 0, 0);
  return followUp <= today;
}

/**
 * Sort contacts by follow-up date (earliest first), then by ID
 */
export function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    // If both have followup dates, sort by date (earliest first), then by ID if dates are equal
    if (a.followUpDate && b.followUpDate) {
      const dateDiff = new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      // If dates are equal, sort by ID
      return a.id - b.id;
    }
    // If only a has a followup date, it comes first
    if (a.followUpDate && !b.followUpDate) {
      return -1;
    }
    // If only b has a followup date, it comes first
    if (!a.followUpDate && b.followUpDate) {
      return 1;
    }
    // If neither has a followup date, sort by ID
    return a.id - b.id;
  });
}

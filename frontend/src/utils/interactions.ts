import type { Interaction } from '../api/types';

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
  limit: number = 3
): Interaction[] {
  const filtered = interactions.filter((interaction) => interaction.contactId === contactId);
  return sortInteractionsByRecency(filtered).slice(0, limit);
}

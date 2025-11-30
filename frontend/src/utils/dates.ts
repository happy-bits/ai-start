/**
 * Format a date string to a localized date string
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString(undefined, options);
}

/**
 * Add days to a date string
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param days - Number of days to add
 * @returns New ISO date string (YYYY-MM-DD)
 */
export function addDays(dateString: string | null, days: number): string {
  if (!dateString) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Add months to a date string
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param months - Number of months to add
 * @returns New ISO date string (YYYY-MM-DD)
 */
export function addMonths(dateString: string | null, months: number): string {
  if (!dateString) {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  }
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}


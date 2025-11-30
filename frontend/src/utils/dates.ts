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

/**
 * Check if a date is a work day (Monday-Friday)
 * @param dateString - ISO date string (YYYY-MM-DD) or Date object
 * @returns True if the date is a work day
 */
export function isWorkDay(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const dayOfWeek = date.getDay();
  
  // Weekend check (0 = Sunday, 6 = Saturday)
  // Work days are Monday (1) through Friday (5)
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Get the next work day from a given date
 * @param dateString - ISO date string (YYYY-MM-DD) or Date object
 * @returns ISO date string (YYYY-MM-DD) of the next work day
 */
export function getNextWorkDay(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const nextDate = new Date(date);
  
  while (!isWorkDay(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate.toISOString().split('T')[0];
}

/**
 * Add work days to today's date
 * @param workDays - Number of work days to add
 * @returns New ISO date string (YYYY-MM-DD)
 */
export function addWorkDaysFromToday(workDays: number): string {
  const today = new Date();
  let currentDate = new Date(today);
  let daysAdded = 0;
  
  // Add work days
  while (daysAdded < workDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isWorkDay(currentDate)) {
      daysAdded++;
    }
  }
  
  return currentDate.toISOString().split('T')[0];
}

/**
 * Add calendar days to today's date
 * @param days - Number of calendar days to add
 * @returns New ISO date string (YYYY-MM-DD)
 */
export function addDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Add months to today's date
 * @param months - Number of months to add
 * @returns New ISO date string (YYYY-MM-DD)
 */
export function addMonthsFromToday(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}


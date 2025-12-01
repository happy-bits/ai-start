/**
 * Shared Tailwind CSS class constants
 * 
 * This file contains commonly used class strings to follow DRY principles.
 * Use these constants instead of repeating class strings across components.
 */

// ============================================================================
// Form Input Styles
// ============================================================================

/** Base styles for form inputs (Input, Select, Textarea) */
export const formInputBase =
  'w-full px-4 py-2.5 bg-dark-800 border rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent transition-all';

/** Border color for form inputs in normal state */
export const formInputBorderNormal = 'border-dark-600';

/** Border color for form inputs in error state */
export const formInputBorderError = 'border-red-500';

/** Helper function to get form input border class */
export const getFormInputBorder = (hasError: boolean): string =>
  hasError ? formInputBorderError : formInputBorderNormal;

// ============================================================================
// Form Label Styles
// ============================================================================

/** Base styles for form labels */
export const formLabel = 'block text-sm font-medium text-dark-300';

// ============================================================================
// Form Error Styles
// ============================================================================

/** Error message text styles */
export const formErrorText = 'text-sm text-red-400';

/** Error message container styles */
export const errorMessageContainer = 'bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm';

// ============================================================================
// Navigation Styles
// ============================================================================

/** Active navigation link styles */
export const navLinkActive =
  'bg-warm-500/10 text-warm-400 border border-warm-500/20';

/** Inactive navigation link styles */
export const navLinkInactive = 'text-dark-400 hover:text-white hover:bg-dark-800';

/** Base navigation link styles */
export const navLinkBase =
  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all';

// ============================================================================
// Container/Card Styles
// ============================================================================

/** Card container with background and border */
export const cardContainer = 'bg-dark-800/50 rounded-lg border border-dark-700';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combines class strings, filtering out empty strings
 */
export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');

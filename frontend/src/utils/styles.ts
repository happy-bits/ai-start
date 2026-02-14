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

/** Error message text styles (smaller variant) */
export const formErrorTextSmall = 'text-xs text-red-400';

/** Error message container styles */
export const errorMessageContainer =
  'bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm';

// ============================================================================
// InlineEditable Styles
// ============================================================================

/** Base styles for InlineEditable inputs when editing */
export const inlineEditableInputBase =
  'px-2 py-1 bg-dark-800 border border-warm-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-warm-500/50 transition-all';

/** Base styles for InlineEditable display mode */
export const inlineEditableDisplayBase =
  'text-sm cursor-pointer hover:text-white transition-colors';

/** Empty state text styles for InlineEditable */
export const inlineEditableEmpty = 'text-dark-500 italic';

/** Normal state text color for InlineEditable */
export const inlineEditableTextNormal = 'text-dark-400';

/** Email type text color for InlineEditable */
export const inlineEditableTextEmail = 'text-dark-300';

/** Textarea display text color */
export const inlineEditableTextareaDisplay = 'text-dark-300';

// ============================================================================
// Button Styles
// ============================================================================

/** Delete button base styles */
export const deleteButtonBase =
  'text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors';

/** Delete button sizes */
export const deleteButtonSize = {
  sm: 'p-1',
  md: 'p-1.5',
};

/** Action button base styles (warm/primary actions) */
export const actionButtonBase = 'text-warm-400 hover:text-warm-300 hover:bg-warm-500/10';

// ============================================================================
// Navigation Styles
// ============================================================================

/** Active navigation link styles */
export const navLinkActive = 'bg-warm-500/10 text-warm-400 border border-warm-500/20';

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

/** Dashed border card container */
export const cardContainerDashed =
  'bg-dark-800/30 rounded-lg border border-dashed border-dark-600 hover:border-warm-500/30 transition-colors';

// ============================================================================
// Icon Container Styles
// ============================================================================

/** Icon container for interaction types */
export const iconContainer =
  'w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-warm-500/10 text-warm-400';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combines class strings, filtering out empty strings
 */
export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');

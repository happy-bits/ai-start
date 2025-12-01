// User roles
export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Session configuration
export const SESSION_CONFIG = {
  DEFAULT_EXPIRY_HOURS: 24,
  TOKEN_LENGTH: 48,
} as const;

// Argon2 password hashing options
export const ARGON_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

// Auth
export const AUTH_HEADER_PREFIX = 'Bearer';

// Error messages
export const ERROR_MESSAGES = {
  // Auth errors
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_OR_EXPIRED_SESSION: 'Invalid or expired session',
  INVALID_CREDENTIALS: 'Invalid email or password',
  NOT_AUTHENTICATED: 'Not authenticated',
  ADMIN_ACCESS_REQUIRED: 'Admin access required',
  ACCESS_DENIED: 'Access denied',

  // Resource errors
  NOT_FOUND: 'Not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  NOT_AVAILABLE_IN_PRODUCTION: 'Not available in production',

  // Seller errors
  SELLER_NOT_FOUND: 'Seller not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',

  // Contact errors
  CONTACT_NOT_FOUND: 'Contact not found',
  INVALID_CONTACT_ID: 'Invalid contact ID',

  // Generic entity errors
  invalidId: (entityName: string) => `Invalid ${entityName} ID`,
  notFound: (entityName: string) => `${entityName} not found`,
  deletedSuccessfully: (entityName: string) => `${entityName} deleted successfully`,
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGGED_OUT: 'Logged out successfully',
  DATABASE_RESET: 'Database reset and seeded successfully',
} as const;


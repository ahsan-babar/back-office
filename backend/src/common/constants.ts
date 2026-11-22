/** HTTP header used to pass the active Session ID on authenticated requests. */
export const SESSION_HEADER_KEY = 'x-session-id';

/** Default pagination settings for back-office user listings. */
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 6,
  MAX_LIMIT: 50,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
} as const;

/** Password security & scrypt key derivation parameters. */
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 6,
  SALT_BYTES: 16,
  KEY_LENGTH: 64,
} as const;

/** Default application server & database configuration fallbacks. */
export const APP_DEFAULTS = {
  PORT: 3000,
  CORS_ORIGIN: 'http://localhost:5173',
  MONGODB_URI: 'mongodb://localhost:27017/back-office',
  API_GLOBAL_PREFIX: 'api',
} as const;

/** Standardized domain error messages for consistent API responses & tests. */
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'A user with this email already exists',
  CREATED_AT_IMMUTABLE: 'Creation time cannot be updated',
  INACTIVE_USER_NAME_LOCKED:
    'First Name and Last Name cannot be updated while the user is inactive',
  BLANK_NAME_NOT_ALLOWED: 'First Name and Last Name cannot be blank',
  INACTIVE_USER_SESSION_FORBIDDEN: 'Inactive users cannot create sessions',
  USER_ACCOUNT_INACTIVE: 'User account is inactive',
  INVALID_CREDENTIALS: 'Invalid email or password',
  MISSING_SESSION_HEADER: `Missing ${SESSION_HEADER_KEY} header`,
  INVALID_SESSION_ID: 'Invalid session identifier',
  SESSION_INACTIVE_OR_EXPIRED: 'Session is inactive or expired',
  SESSION_NOT_FOUND: 'Session not found',
} as const;

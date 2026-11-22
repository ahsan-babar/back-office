/** Base URL for the backend REST API. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/** HTTP header and localStorage keys used for session authentication. */
export const SESSION_HEADER_KEY = 'x-session-id';
export const SESSION_STORAGE_KEY = 'backoffice_session_id';

/** Custom DOM event emitted whenever the API responds with 401 Unauthorized. */
export const UNAUTHORIZED_EVENT = 'backoffice:unauthorized';

/** Default pagination settings matching backend constraints (max 6 per page). */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  PAGE_SIZE: 6,
} as const;

/** Password minimum length matching backend DTO validation. */
export const PASSWORD_MIN_LENGTH = 6;

/** Application client-side route paths. */
export const APP_ROUTES = {
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  USERS: '/users',
} as const;

/** Backend REST endpoint paths. */
export const API_ENDPOINTS = {
  AUTH_SIGNUP: '/auth/signup',
  AUTH_SIGNIN: '/auth/signin',
  AUTH_ME: '/auth/me',
  USERS: '/users',
  SESSIONS: '/sessions',
} as const;

/** Standardized UI copy and helper hints. */
export const UI_MESSAGES = {
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  INACTIVE_NAME_LOCK_HINT:
    'First Name and Last Name cannot be edited while the user is inactive. Activate the user first.',
  DELETE_USER_CONFIRM_TITLE: 'Delete User',
  DELETE_USER_CONFIRM_BODY:
    'Are you sure you want to permanently delete this user? Any active sessions for this user will be immediately terminated.',
} as const;

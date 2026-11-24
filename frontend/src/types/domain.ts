/**
 * Lifecycle state of a back-office user account.
 *
 * - `'active'` — User can authenticate, create sessions, and have `firstName`/`lastName` edited.
 * - `'inactive'` — User cannot sign in, all existing sessions are revoked, and `firstName`/`lastName` are locked from edits.
 */
export type UserStatus = 'active' | 'inactive';

/**
 * Sanitized user profile returned by the Back-Office REST API (`passwordHash` is never exposed).
 */
export interface User {
  /** Unique database identifier (MongoDB ObjectId string). */
  id: string;
  /** Given name (immutable while {@link status} is `'inactive'`). */
  firstName: string;
  /** Family name (immutable while {@link status} is `'inactive'`). */
  lastName: string;
  /** Unique normalized email address used for authentication. */
  email: string;
  /** Current account activation status. */
  status: UserStatus;
  /** Total number of successful sign-ins recorded for this account. */
  loginsCounter: number;
  /** ISO-8601 timestamp when the user record was created (immutable). */
  createdAt: string;
  /** ISO-8601 timestamp when the user record was last modified. */
  updatedAt: string;
}

/**
 * Authentication session record tracking operator login lifecycle.
 */
export interface Session {
  /** Unique session identifier transmitted via the `x-session-id` request header. */
  id: string;
  /** Identifier of the {@link User} owning this session. */
  userId: string;
  /** ISO-8601 timestamp when the session was opened. */
  createdAt: string;
  /** ISO-8601 timestamp when the session was terminated, or `null` if still active. */
  terminatedAt: string | null;
}

/**
 * Composite payload returned upon successful sign-up, sign-in, or session hydration.
 */
export interface AuthSessionResponse {
  /** Active session metadata. */
  session: Session;
  /** Authenticated user profile. */
  user: User;
}

/**
 * Paginated collection envelope returned by `GET /api/users`.
 */
export interface PaginatedUsersResponse {
  /** Slice of {@link User} records for the requested page. */
  items: User[];
  /** Total count of user records across all pages. */
  total: number;
  /** Current 1-based page number. */
  page: number;
  /** Maximum records returned per page. */
  limit: number;
  /** Total number of available pages. */
  totalPages: number;
}

/**
 * Request body for self-registration (`POST /api/auth/signup`).
 */
export interface SignUpPayload {
  /** Operator's given name. */
  firstName: string;
  /** Operator's family name. */
  lastName: string;
  /** Unique email address for the new account. */
  email: string;
  /** Plain-text password (hashed server-side before persistence). */
  password: string;
}

/**
 * Request body for operator authentication (`POST /api/auth/signin`).
 */
export interface SignInPayload {
  /** Registered account email address. */
  email: string;
  /** Account password. */
  password: string;
}

/**
 * Request body for administrative user creation (`POST /api/users`).
 */
export interface CreateUserPayload {
  /** User's given name. */
  firstName: string;
  /** User's family name. */
  lastName: string;
  /** Unique email address for the user. */
  email: string;
  /** Initial plain-text password (hashed server-side before persistence). */
  password: string;
  /** Optional initial activation status (defaults to `'active'` on the backend). */
  status?: UserStatus;
}

/**
 * Request body for partial user updates (`PATCH /api/users/:id`).
 */
export interface UpdateUserPayload {
  /** Updated given name (rejected by the backend if the user's current status is `'inactive'`). */
  firstName?: string;
  /** Updated family name (rejected by the backend if the user's current status is `'inactive'`). */
  lastName?: string;
  /** Updated unique email address. */
  email?: string;
  /** Updated activation status (`'inactive'` revokes all active sessions for the user). */
  status?: UserStatus;
}

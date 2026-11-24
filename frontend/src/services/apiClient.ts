import {
  API_BASE_URL,
  API_ENDPOINTS,
  PAGINATION_CONFIG,
  SESSION_HEADER_KEY,
  SESSION_STORAGE_KEY,
  UI_MESSAGES,
  UNAUTHORIZED_EVENT,
} from '../config/constants';
import {
  AuthSessionResponse,
  CreateUserPayload,
  PaginatedUsersResponse,
  Session,
  SignInPayload,
  SignUpPayload,
  UpdateUserPayload,
  User,
} from '../types/domain';

/**
 * Custom error thrown when the backend REST API responds with a non-2xx HTTP status.
 */
export class ApiError extends Error {
  /** HTTP status code returned by the server (e.g., `400`, `401`, `404`, `409`). */
  readonly status: number;

  /**
   * @param status - HTTP response status code.
   * @param message - Human-readable error message extracted from the API payload or fallback UI text.
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Retrieves the persisted active session identifier from `localStorage`.
 *
 * @returns The stored session ID, or `null` when no session is persisted.
 */
export function getStoredSessionId(): string | null {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

/**
 * Persists or clears the active session identifier in `localStorage`.
 *
 * @param sessionId - Session ID to store, or `null` to remove the entry.
 */
export function setStoredSessionId(sessionId: string | null): void {
  if (sessionId) {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Generic typed Fetch wrapper that:
 * - Automatically attaches `Content-Type: application/json` when a request body is present.
 * - Injects the active session ID header (`x-session-id`) from storage.
 * - Clears local session storage and dispatches {@link UNAUTHORIZED_EVENT} on `401` responses
 *   unless `skipUnauthorizedEvent` is set.
 * - Normalizes NestJS validation error arrays and server messages into {@link ApiError}.
 *
 * @typeParam T - Expected parsed JSON response type.
 * @param path - Endpoint path relative to {@link API_BASE_URL}.
 * @param options - Standard Fetch `RequestInit` options plus `skipUnauthorizedEvent`.
 * @throws {ApiError} When the HTTP response status is outside the `200–299` range.
 */
async function request<T>(
  path: string,
  options: RequestInit & { skipUnauthorizedEvent?: boolean } = {},
): Promise<T> {
  const { skipUnauthorizedEvent, headers, ...restOptions } = options;
  const sessionId = getStoredSessionId();

  const mergedHeaders = new Headers(headers);
  if (!mergedHeaders.has('Content-Type') && restOptions.body) {
    mergedHeaders.set('Content-Type', 'application/json');
  }
  if (sessionId) {
    mergedHeaders.set(SESSION_HEADER_KEY, sessionId);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: mergedHeaders,
  });

  if (response.status === 401 && !skipUnauthorizedEvent) {
    setStoredSessionId(null);
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : UI_MESSAGES.GENERIC_ERROR;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

/**
 * Typed REST API client encapsulating authentication, session lifecycle, and user CRUD operations.
 */
export const apiClient = {
  /**
   * Registers a new user account and opens an initial authenticated session.
   *
   * @param payload - New operator registration details.
   * @returns Created user profile and active session metadata.
   */
  signUp(payload: SignUpPayload): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>(API_ENDPOINTS.AUTH_SIGNUP, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipUnauthorizedEvent: true,
    });
  },

  /**
   * Authenticates an existing active user with email and password credentials.
   *
   * @param payload - Sign-in email and password.
   * @returns Authenticated user profile and newly created session metadata.
   */
  signIn(payload: SignInPayload): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>(API_ENDPOINTS.AUTH_SIGNIN, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipUnauthorizedEvent: true,
    });
  },

  /**
   * Validates the currently stored session ID and retrieves the associated user and session.
   *
   * @returns Active user profile and session metadata.
   */  
  getCurrentSession(): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>(API_ENDPOINTS.AUTH_ME, {
      method: 'GET',
      skipUnauthorizedEvent: true,
    });
  },

  /**
   * Terminates an active session by its unique identifier.
   *
   * @param sessionId - ID of the session to revoke.
   * @returns The terminated session record containing `terminatedAt`.
   */
  terminateSession(sessionId: string): Promise<Session> {
    return request<Session>(`${API_ENDPOINTS.SESSIONS}/${sessionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetches a paginated slice of users from the directory.
   *
   * @param page - 1-based page number (defaults to {@link PAGINATION_CONFIG.DEFAULT_PAGE}).
   * @param limit - Maximum records per page (defaults to {@link PAGINATION_CONFIG.PAGE_SIZE}).
   * @returns Paginated user items, total record count, and pagination metadata.
   */
  getUsers(
    page: number = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit: number = PAGINATION_CONFIG.PAGE_SIZE,
  ): Promise<PaginatedUsersResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return request<PaginatedUsersResponse>(`${API_ENDPOINTS.USERS}?${query.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Creates a new managed user in the directory.
   *
   * @param payload - User creation fields (`firstName`, `lastName`, `email`, `password`, `status`).
   * @returns Newly created user record.
   */
  createUser(payload: CreateUserPayload): Promise<User> {
    return request<User>(API_ENDPOINTS.USERS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates an existing user's editable attributes (`firstName`, `lastName`, `email`, `status`).
   *
   * @param id - Target user ID.
   * @param payload - Partial user update fields.
   * @returns Updated user record.
   */
  updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    return request<User>(`${API_ENDPOINTS.USERS}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Permanently deletes a user and revokes all of their active sessions on the backend.
   *
   * @param id - Target user ID to delete.
   */
  deleteUser(id: string): Promise<void> {
    return request<void>(`${API_ENDPOINTS.USERS}/${id}`, {
      method: 'DELETE',
    });
  },
};

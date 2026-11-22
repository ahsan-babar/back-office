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
  
  export class ApiError extends Error {
    readonly status: number;
  
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  
  export function getStoredSessionId(): string | null {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  }
  
  export function setStoredSessionId(sessionId: string | null): void {
    if (sessionId) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
  
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
  
  export const apiClient = {
    signUp(payload: SignUpPayload): Promise<AuthSessionResponse> {
      return request<AuthSessionResponse>(API_ENDPOINTS.AUTH_SIGNUP, {
        method: 'POST',
        body: JSON.stringify(payload),
        skipUnauthorizedEvent: true,
      });
    },
  
    signIn(payload: SignInPayload): Promise<AuthSessionResponse> {
      return request<AuthSessionResponse>(API_ENDPOINTS.AUTH_SIGNIN, {
        method: 'POST',
        body: JSON.stringify(payload),
        skipUnauthorizedEvent: true,
      });
    },
  
    getCurrentSession(): Promise<AuthSessionResponse> {
      return request<AuthSessionResponse>(API_ENDPOINTS.AUTH_ME, {
        method: 'GET',
        skipUnauthorizedEvent: true,
      });
    },
  
    terminateSession(sessionId: string): Promise<Session> {
      return request<Session>(`${API_ENDPOINTS.SESSIONS}/${sessionId}`, {
        method: 'DELETE',
      });
    },
  
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
  
    createUser(payload: CreateUserPayload): Promise<User> {
      return request<User>(API_ENDPOINTS.USERS, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  
    updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
      return request<User>(`${API_ENDPOINTS.USERS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  
    deleteUser(id: string): Promise<void> {
      return request<void>(`${API_ENDPOINTS.USERS}/${id}`, {
        method: 'DELETE',
      });
    },
  };
  
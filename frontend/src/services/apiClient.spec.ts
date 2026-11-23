import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_HEADER_KEY,
  UNAUTHORIZED_EVENT,
} from '../config/constants';
import {
  ApiError,
  apiClient,
  getStoredSessionId,
  setStoredSessionId,
} from './apiClient';

describe('apiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches x-session-id header when a session is stored', async () => {
    setStoredSessionId('sess-123');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ items: [], total: 0, page: 1, limit: 6, totalPages: 1 }),
        { status: 200 },
      ),
    );

    await apiClient.getUsers(1, 6);

    const firstCall = fetchSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [, init] = firstCall!;
    const headers = init?.headers as Headers;
    expect(headers.get(SESSION_HEADER_KEY)).toBe('sess-123');
  });

  it('clears stored session and dispatches unauthorized event on 401 responses', async () => {
    setStoredSessionId('expired-session');
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Session is inactive or expired' }), {
        status: 401,
      }),
    );

    await expect(apiClient.getUsers()).rejects.toBeInstanceOf(ApiError);
    expect(getStoredSessionId()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('formats NestJS validation error arrays into a readable ApiError message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ message: ['email must be an email', 'password is too short'] }),
        { status: 400 },
      ),
    );

    await expect(
      apiClient.signUp({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'bad',
        password: '123',
      }),
    ).rejects.toThrow('email must be an email, password is too short');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { SESSION_HEADER_KEY } from '../config/constants';
import {
  apiClient,
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

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get(SESSION_HEADER_KEY)).toBe('sess-123');
  });
});

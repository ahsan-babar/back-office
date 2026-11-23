import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { APP_ROUTES, UI_MESSAGES } from './config/constants';
import { apiClient, setStoredSessionId } from './services/apiClient';
import { User } from './types/domain';

const activeAdminUser: User = {
  id: 'u-admin',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  status: 'active',
  loginsCounter: 3,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-11T10:00:00.000Z',
};

const inactiveUser: User = {
  id: 'u-inactive',
  firstName: 'Alan',
  lastName: 'Turing',
  email: 'alan@example.com',
  status: 'inactive',
  loginsCounter: 1,
  createdAt: '2026-01-08T10:00:00.000Z',
  updatedAt: '2026-01-09T10:00:00.000Z',
};

describe('Back-Office Frontend Flows (TDD Spec)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated visitors on /users to /signin', async () => {
    render(
      <MemoryRouter initialEntries={[APP_ROUTES.USERS]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('allows a user to sign in, persists session, and renders paginated users table', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'signIn').mockResolvedValue({
      session: {
        id: 'sess-active-1',
        userId: activeAdminUser.id,
        createdAt: '2026-01-11T10:00:00.000Z',
        terminatedAt: null,
      },
      user: activeAdminUser,
    });
    vi.spyOn(apiClient, 'getUsers').mockResolvedValue({
      items: [activeAdminUser, inactiveUser],
      total: 8,
      page: 1,
      limit: 6,
      totalPages: 2,
    });

    render(
      <MemoryRouter initialEntries={[APP_ROUTES.SIGN_IN]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('alan@example.com')).toBeInTheDocument();
    expect(apiClient.getUsers).toHaveBeenCalledWith(1, 6);
  });

  it('disables First Name and Last Name inputs when editing an inactive user', async () => {
    const user = userEvent.setup();
    setStoredSessionId('sess-active-1');

    vi.spyOn(apiClient, 'getCurrentSession').mockResolvedValue({
      session: {
        id: 'sess-active-1',
        userId: activeAdminUser.id,
        createdAt: '2026-01-11T10:00:00.000Z',
        terminatedAt: null,
      },
      user: activeAdminUser,
    });
    vi.spyOn(apiClient, 'getUsers').mockResolvedValue({
      items: [inactiveUser],
      total: 1,
      page: 1,
      limit: 6,
      totalPages: 1,
    });

    render(
      <MemoryRouter initialEntries={[APP_ROUTES.USERS]}>
        <App />
      </MemoryRouter>,
    );

    const editBtn = await screen.findByRole('button', { name: /edit alan turing/i });
    await user.click(editBtn);

    const firstNameInput = await screen.findByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    expect(firstNameInput).toBeDisabled();
    expect(lastNameInput).toBeDisabled();
    expect(screen.getByText(UI_MESSAGES.INACTIVE_NAME_LOCK_HINT)).toBeInTheDocument();
  });

  it('terminates session on sign out and returns to /signin', async () => {
    const user = userEvent.setup();
    setStoredSessionId('sess-active-1');

    vi.spyOn(apiClient, 'getCurrentSession').mockResolvedValue({
      session: {
        id: 'sess-active-1',
        userId: activeAdminUser.id,
        createdAt: '2026-01-11T10:00:00.000Z',
        terminatedAt: null,
      },
      user: activeAdminUser,
    });
    vi.spyOn(apiClient, 'getUsers').mockResolvedValue({
      items: [activeAdminUser],
      total: 1,
      page: 1,
      limit: 6,
      totalPages: 1,
    });
    const terminateSpy = vi.spyOn(apiClient, 'terminateSession').mockResolvedValue({
      id: 'sess-active-1',
      userId: activeAdminUser.id,
      createdAt: '2026-01-11T10:00:00.000Z',
      terminatedAt: '2026-01-11T11:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={[APP_ROUTES.USERS]}>
        <App />
      </MemoryRouter>,
    );

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    await user.click(signOutBtn);

    await waitFor(() => {
      expect(terminateSpy).toHaveBeenCalledWith('sess-active-1');
    });
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});

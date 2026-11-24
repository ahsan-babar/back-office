import {
  act,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { APP_ROUTES, THEME_STORAGE_KEY, UI_MESSAGES, UNAUTHORIZED_EVENT } from './config/constants';
import { apiClient, setStoredSessionId } from './services/apiClient';
import { User } from './types/domain';

function renderApp(initialRoute = '/users') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );
}

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

describe('Back-Office Frontend Flows', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated visitors on /users to /signup', async () => {
    render(
      <MemoryRouter initialEntries={[APP_ROUTES.USERS]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  });

  it('blocks sign up when password and confirm password do not match', async () => {
    const user = userEvent.setup();
    const signUpSpy = vi.spyOn(apiClient, 'signUp');

    render(
      <MemoryRouter initialEntries={[APP_ROUTES.SIGN_UP]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/first name/i), 'Ada');
    await user.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass456');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(signUpSpy).not.toHaveBeenCalled();
  });

  it('allows a new user to sign up when passwords match and greets them on /users', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'signUp').mockResolvedValue({
      session: {
        id: 'sess-signup-1',
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

    render(
      <MemoryRouter initialEntries={[APP_ROUTES.SIGN_UP]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/first name/i), 'Ada');
    await user.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText('Hello Ada')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/^password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Hello Ada')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
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

  it('creates and deletes a user via dialogs and navigates pagination pages', async () => {
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
    const getUsersSpy = vi.spyOn(apiClient, 'getUsers').mockResolvedValue({
      items: [activeAdminUser],
      total: 8,
      page: 1,
      limit: 6,
      totalPages: 2,
    });
    const createSpy = vi.spyOn(apiClient, 'createUser').mockResolvedValue(inactiveUser);
    const deleteSpy = vi.spyOn(apiClient, 'deleteUser').mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={[APP_ROUTES.USERS]}>
        <App />
      </MemoryRouter>,
    );

    // Create user modal flow
    await user.click(await screen.findByRole('button', { name: /new user/i }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText(/first name/i), 'Grace');
    await user.type(within(createDialog).getByLabelText(/last name/i), 'Hopper');
    await user.type(within(createDialog).getByLabelText(/email/i), 'grace@example.com');
    await user.type(within(createDialog).getByLabelText(/^password/i), 'StrongPass123');
    await user.click(within(createDialog).getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        password: 'StrongPass123',
        status: 'active',
      });
    });

    await waitForElementToBeRemoved(createDialog);

    // Pagination click to page 2
    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));
    expect(getUsersSpy).toHaveBeenCalledWith(2, 6);

    // Delete user confirmation flow
    await user.click(screen.getByRole('button', { name: /delete ada lovelace/i }));
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(activeAdminUser.id);
    });
  });

  it('terminates session on log out and navigates to /signin', async () => {
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

    const logOutBtn = await screen.findByRole('button', { name: /log out/i });
    await user.click(logOutBtn);

    await waitFor(() => {
      expect(terminateSpy).toHaveBeenCalledWith('sess-active-1');
    });
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggles light/dark theme and persists selection across app re-opens', async () => {
    const user = userEvent.setup();
    localStorage.removeItem(THEME_STORAGE_KEY);

    const { unmount } = render(
      <MemoryRouter initialEntries={[APP_ROUTES.SIGN_UP]}>
        <App />
      </MemoryRouter>,
    );

    const darkToggleBtn = screen.getByRole('button', {
      name: /switch to dark theme/i,
    });
    await user.click(darkToggleBtn);

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(
      screen.getByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument();

    // Simulate closing and reopening the application
    unmount();

    render(
      <MemoryRouter initialEntries={[APP_ROUTES.SIGN_UP]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument();
  });

  it('blocks sign-up client-side when password and confirm password do not match', async () => {
    const signUpSpy = vi.spyOn(apiClient, 'signUp');
    const user = userEvent.setup();
    renderApp('/signup');

    await user.type(screen.getByLabelText(/first name/i), 'Ada');
    await user.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123!');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(signUpSpy).not.toHaveBeenCalled();
  });

  it('displays API error banner on Sign In failure', async () => {
    vi.spyOn(apiClient, 'signIn').mockRejectedValueOnce(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderApp('/signin');

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('redirects to /signin when an API request dispatches global 401 unauthorized event', async () => {
    setStoredSessionId('sess-active-1');
    vi.spyOn(apiClient, 'getCurrentSession').mockResolvedValueOnce({
      session: {
        id: 'sess-active-1',
        userId: 'u-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        terminatedAt: null,
      },
      user: {
        id: 'u-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        status: 'active',
        loginsCounter: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    vi.spyOn(apiClient, 'getUsers').mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      limit: 6,
      totalPages: 1,
    });

    renderApp('/users');
    expect(await screen.findByText(/hello ada/i)).toBeInTheDocument();

    // Dispatch the exact UNAUTHORIZED_EVENT constant listened to by AuthProvider
    act(() => {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    });

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('deletes a user via confirmation modal and steps back a page when last item on page 2 is removed', async () => {
    setStoredSessionId('sess-active-1');
    vi.spyOn(apiClient, 'getCurrentSession').mockResolvedValueOnce({
      session: {
        id: 'sess-active-1',
        userId: 'u-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        terminatedAt: null,
      },
      user: {
        id: 'u-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        status: 'active',
        loginsCounter: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const getUsersSpy = vi
      .spyOn(apiClient, 'getUsers')
      // Page 1 initial load (7 total -> 2 pages)
      .mockResolvedValueOnce({
        items: Array.from({ length: 6 }, (_, i) => ({
          id: `u-${i + 1}`,
          firstName: `User${i + 1}`,
          lastName: 'Test',
          email: `user${i + 1}@example.com`,
          status: 'active' as const,
          loginsCounter: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        })),
        total: 7,
        page: 1,
        limit: 6,
        totalPages: 2,
      })
      // Page 2 load (1 item on page 2)
      .mockResolvedValueOnce({
        items: [
          {
            id: 'u-7',
            firstName: 'Seventh',
            lastName: 'User',
            email: 'user7@example.com',
            status: 'active',
            loginsCounter: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        total: 7,
        page: 2,
        limit: 6,
        totalPages: 2,
      })
      // Reload Page 1 after deleting final item on Page 2
      .mockResolvedValueOnce({
        items: [],
        total: 6,
        page: 1,
        limit: 6,
        totalPages: 1,
      });

    const deleteSpy = vi.spyOn(apiClient, 'deleteUser').mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderApp('/users');

    // Navigate to Page 2
    const page2Button = await screen.findByRole('button', { name: /go to page 2/i });
    await user.click(page2Button);
    expect(await screen.findByText('user7@example.com')).toBeInTheDocument();

    // Open Delete dialog and confirm
    await user.click(screen.getByRole('button', { name: /delete/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('u-7');
      expect(getUsersSpy).toHaveBeenLastCalledWith(1, 6);
    });
  });

  it('toggles light/dark theme and persists preference in localStorage', async () => {
    const user = userEvent.setup();
    renderApp('/signin');

    const toggleBtn = screen.getByRole('button', { name: /switch to dark theme/i });
    await user.click(toggleBtn);

    expect(
      await screen.findByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument();
  });

});

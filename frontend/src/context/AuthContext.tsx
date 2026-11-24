import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { UNAUTHORIZED_EVENT } from '../config/constants';
import {
  apiClient,
  getStoredSessionId,
  setStoredSessionId,
} from '../services/apiClient';
import { Session, SignInPayload, SignUpPayload, User } from '../types/domain';

/**
 * Shape of the authentication state and actions exposed to the React component tree.
 */
interface AuthContextValue {
  /** Currently authenticated user profile, or `null` when unauthenticated. */
  user: User | null;
  /** Active backend session metadata, or `null` when no session exists. */
  session: Session | null;
  /** `true` while hydrating an existing stored session on initial application load. */
  isLoading: boolean;
  /**
   * Synchronously reports whether the current unauthenticated state resulted from
   * an explicit logout or an HTTP 401 session revocation (used by `ProtectedRoute`
   * to route logged-out users to `/signin` while routing fresh visitors to `/signup`).
   */
  wasLoggedOut: () => boolean;
  /** Authenticates an existing active user and persists the resulting session ID. */
  signIn: (payload: SignInPayload) => Promise<void>;
  /** Registers a new user account, opens an initial session, and persists its ID. */
  signUp: (payload: SignUpPayload) => Promise<void>;
  /** Terminates the active session on the backend and clears local client state. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Top-level authentication provider managing session hydration, sign-in/sign-up,
 * explicit logout, and global `401 Unauthorized` event handling.
 *
 * @param props.children - Descendant route and UI components requiring auth context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredSessionId()));
  const loggedOutRef = useRef<boolean>(false);

  // Hydrate an existing session from localStorage on initial mount.
  useEffect(() => {
    const existingSessionId = getStoredSessionId();
    if (!existingSessionId) return;

    let isMounted = true;
    apiClient
      .getCurrentSession()
      .then((res) => {
        if (!isMounted) return;
        setUser(res.user);
        setSession(res.session);
      })
      .catch(() => {
        if (!isMounted) return;
        setStoredSessionId(null);
        setUser(null);
        setSession(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // React to global 401 responses emitted by the API client (e.g., revoked session).
  useEffect(() => {
    const handleUnauthorized = () => {
      loggedOutRef.current = true;
      setUser(null);
      setSession(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const wasLoggedOut = useCallback(() => loggedOutRef.current, []);

  const signIn = useCallback(async (payload: SignInPayload) => {
    const res = await apiClient.signIn(payload);
    loggedOutRef.current = false;
    setStoredSessionId(res.session.id);
    setSession(res.session);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const res = await apiClient.signUp(payload);
    loggedOutRef.current = false;
    setStoredSessionId(res.session.id);
    setSession(res.session);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    // Set synchronously prior to async termination/state reset to avoid route race conditions.    
    const activeSessionId = session?.id ?? getStoredSessionId();
    loggedOutRef.current = true;
    try {
      if (activeSessionId) {
        await apiClient.terminateSession(activeSessionId);
      }
    } finally {
      setStoredSessionId(null);
      setSession(null);
      setUser(null);
    }
  }, [session?.id]);

  const value = useMemo(
    () => ({ user, session, isLoading, wasLoggedOut, signIn, signUp, signOut }),
    [user, session, isLoading, wasLoggedOut, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook providing type-safe access to {@link AuthContextValue}.
 *
 * @throws {Error} When invoked outside of an {@link AuthProvider} tree.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}

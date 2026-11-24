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

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  wasLoggedOut: () => boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredSessionId()));
  const loggedOutRef = useRef<boolean>(false);

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}

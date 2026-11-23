import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredSessionId()));

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
      setUser(null);
      setSession(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const signIn = useCallback(async (payload: SignInPayload) => {
    const res = await apiClient.signIn(payload);
    setStoredSessionId(res.session.id);
    setSession(res.session);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const res = await apiClient.signUp(payload);
    setStoredSessionId(res.session.id);
    setSession(res.session);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    const currentId = session?.id || getStoredSessionId();
    try {
      if (currentId) {
        await apiClient.terminateSession(currentId);
      }
    } finally {
      setStoredSessionId(null);
      setSession(null);
      setUser(null);
    }
  }, [session]);

  const value = useMemo(
    () => ({ user, session, isLoading, signIn, signUp, signOut }),
    [user, session, isLoading, signIn, signUp, signOut],
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

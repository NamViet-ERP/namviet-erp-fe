import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AUTH_CHANGED_EVENT,
  getSessionPermissions,
  getSessionUser,
} from '../constants/systemUsers';
import type { SystemUser } from '../types/systemUser';

export interface SessionValue {
  user: SystemUser | undefined;
  permissions: string[];
  refresh: () => void;
}

const AuthContext = createContext<SessionValue | null>(null);

function readSession(): Pick<SessionValue, 'user' | 'permissions'> {
  return {
    user: getSessionUser(),
    permissions: getSessionPermissions(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(readSession);

  const refresh = useCallback(() => {
    setSnapshot(readSession());
  }, []);

  useEffect(() => {
    const onAuth = () => refresh();
    window.addEventListener(AUTH_CHANGED_EVENT, onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ user: snapshot.user, permissions: snapshot.permissions, refresh }),
    [snapshot, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook colocated with provider (standard React context pattern)
// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useSession must be used within AuthProvider');
  }
  return ctx;
}

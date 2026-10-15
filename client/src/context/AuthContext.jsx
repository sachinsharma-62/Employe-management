import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import authApi from '../api/auth.api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const userRef = useRef(null);
  const toast = useToast();

  userRef.current = user;

  const loadSession = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const onExpired = () => {
      const hadUser = Boolean(userRef.current);
      setUser(null);
      setStatus('guest');
      if (hadUser) toast.error('Session expired. Please log in again.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [toast]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    setUser(res.data.user);
    setStatus('authenticated');
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      login,
      logout,
      logoutAll,
      updateUser,
      reloadUser: loadSession,
    }),
    [user, status, login, logout, logoutAll, updateUser, loadSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

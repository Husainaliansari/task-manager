import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { onUnauthorized, session } from '../api/client';

const AuthContext = createContext(null);

const EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
const MAX_TIMEOUT = 2_147_483_647;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [notice, setNotice] = useState(null); // shown on the login page, e.g. "session expired"

  const endSession = useCallback((message = null) => {
    session.clear();
    setUser(null);
    setNotice(message);
  }, []);

  // On first load, check whether the saved token still works.
  useEffect(() => {
    onUnauthorized(() => endSession(EXPIRED_MESSAGE));

    if (!session.get()) {
      setIsReady(true);
      return;
    }

    authApi
      .me()
      .then(({ data }) => setUser(data))
      .catch(() => session.clear())
      .finally(() => setIsReady(true));
  }, [endSession]);

  // Log out by ourselves the moment the token expires, instead of waiting
  // for the next request to fail.
  useEffect(() => {
    const expiresAt = session.get()?.expiresAt;
    if (!user || !expiresAt) return undefined;

    // (setTimeout can't wait longer than ~24 days, hence the cap and the re-check.
    // Very long-lived tokens are still caught by the 401 handler above.)
    const delay = Math.min(new Date(expiresAt) - Date.now(), MAX_TIMEOUT);
    const timer = setTimeout(() => {
      if (Date.now() >= new Date(expiresAt)) endSession(EXPIRED_MESSAGE);
    }, delay);
    return () => clearTimeout(timer);
  }, [user, endSession]);

  const startSession = useCallback(({ user, token, expires_at: expiresAt }) => {
    session.save(token, expiresAt);
    setUser(user);
    setNotice(null);
  }, []);

  const login = useCallback(
    async (email, password) => startSession(await authApi.login(email, password)),
    [startSession],
  );

  const register = useCallback(async (form) => startSession(await authApi.register(form)), [startSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // revokes the token on the server
    } finally {
      endSession();
    }
  }, [endSession]);

  const value = useMemo(
    () => ({ user, isReady, isAdmin: user?.role === 'admin', notice, login, register, logout }),
    [user, isReady, notice, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, token as tokenStore } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  // On mount: if we have a stored access token, fetch the current user
  useEffect(() => {
    const stored = tokenStore.getAccess();
    if (!stored) { setLoading(false); return; }

    authApi.me()
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (fields) => {
    const data = await authApi.register(fields);
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

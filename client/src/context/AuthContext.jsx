import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getToken, setToken, clearToken, login as loginRequest, fetchCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetchCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => clearToken())
      .finally(() => setCheckingSession(false));
  }, []);

  const login = useCallback(async (usernameInput, password) => {
    const { token, username, name, role } = await loginRequest(usernameInput, password);
    setToken(token);
    setUser({ username, name, role });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = {
    username: user?.username || null,
    name: user?.name || null,
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    isAuthenticated: Boolean(user),
    checkingSession,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

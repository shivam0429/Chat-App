import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { fetchMe } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'chatapp_token';

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const setToken = useCallback((newToken) => {
    if (newToken) {
      sessionStorage.setItem(TOKEN_KEY, newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      delete api.defaults.headers.common.Authorization;
    }
    setTokenState(newToken || '');
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      try {
        const data = await fetchMe();
        setUser(data.user);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithToken = useCallback(
    (newToken, newUser) => {
      setToken(newToken);
      setUser(newUser);
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isAuthenticated: Boolean(token && user),
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

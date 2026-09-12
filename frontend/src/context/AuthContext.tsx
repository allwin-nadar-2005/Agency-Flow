import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import api, { setAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt silent refresh on initial load
    const initAuth = async () => {
      try {
        const res = await api.post('/auth/refresh');
        const token = res.data.data.accessToken;
        const userData = res.data.data.user;
        setAccessToken(token);
        setAccessTokenState(token);
        setUser(userData);
      } catch (err) {
        setAccessToken(null);
        setAccessTokenState(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken: token } = res.data.data;
    setAccessToken(token);
    setAccessTokenState(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken: accessTokenState, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

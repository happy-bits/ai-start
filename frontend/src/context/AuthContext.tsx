import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getCurrentUser, logout as logoutApi } from '../api/auth';
import type { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      // Validate token by fetching current user
      getCurrentUser()
        .then((user) => {
          setUser(user);
        })
        .catch(() => {
          apiClient.setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, user: User) => {
    // Clear all cached queries when switching users
    queryClient.clear();
    apiClient.setToken(token);
    setUser(user);
  };

  const logout = () => {
    logoutApi().catch(() => {
      // Ignore errors on logout
    });
    apiClient.setToken(null);
    setUser(null);
    // Clear all cached queries on logout
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


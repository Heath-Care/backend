import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RegisterPayload, AuthModalMode } from './authTypes';
import { authService } from './authService';
import { AuthModal } from './AuthModal';
import { ApiClientError } from '../services/httpClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authModalMode: AuthModalMode;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  closeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>(null);

  // Authoritative session verification on mount directly from FastAPI
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        // Direct query to FastAPI /api/v1/auth/me using browser HttpOnly cookie
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setUser(null);
          if (err instanceof ApiClientError && err.status === 401) {
            // Unauthenticated: standard clean logged-out state
            setError(null);
          } else if (err?.isOffline || err?.status === 0) {
            // Backend unavailable: unresolved status, never treat cached user as authenticated
            setError('FastAPI authentication service is currently unreachable.');
          } else {
            setError(err?.message || 'Authentication session could not be verified.');
          }
          setIsLoading(false);
        }
      }
    }

    checkAuthSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setError(null);
    const res = await authService.login({ email, password: pass });
    setUser(res.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    const res = await authService.register(payload);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const openLoginModal = useCallback(() => setAuthModalMode('login'), []);
  const openRegisterModal = useCallback(() => setAuthModalMode('register'), []);
  const closeModal = useCallback(() => setAuthModalMode(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        authModalMode,
        login,
        register,
        logout,
        openLoginModal,
        openRegisterModal,
        closeModal,
      }}
    >
      {children}
      <AuthModal />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

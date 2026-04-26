import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  bio?: string;
  city?: string;
  profilePhoto?: string;
  points: number;
  carbonSaved: number;
  badges: string[];
  honestyScore: number;
  favourites?: string[];
  authProvider?: 'local' | 'google' | 'github';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any | void>;
  loginWithToken: (token: string, userData: User) => void;
  register: (email: string, password: string, name?: string) => Promise<any | void>;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: load from localStorage immediately for fast UI, then
  // ALWAYS verify with backend via /api/auth/me (critical for OAuth flow)
  useEffect(() => {
    // Load cached user for instant UI (non-blocking)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUser = localStorage.getItem('commuteSmart_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          console.log('Loaded user from localStorage (cached)');
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      try { localStorage.removeItem('commuteSmart_user'); } catch {}
    }

    // Always verify with backend — this is what makes OAuth work
    // (cookie is set by OAuth callback, localStorage is empty)
    const verifyAuth = async () => {
      try {
        const response = await authAPI.me();
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          try {
            localStorage.setItem('commuteSmart_user', JSON.stringify(response.data.user));
            console.log('Auth verified with backend, user synced');
          } catch {}
        }
      } catch {
        // No valid cookie — clear cached user if no backend auth
        setUser(null);
        try { localStorage.removeItem('commuteSmart_user'); } catch {}
        console.log('No backend auth, cleared user');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);




  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      // If verification is required, don't set user, just return the data to the component
      if (response.data.requiresVerification) {
        return response.data;
      }

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // Store user data in localStorage for persistence
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('commuteSmart_user', JSON.stringify(response.data.user));
            console.log('Stored user data in localStorage after login');
          }
        } catch (storageError) {
          console.error('Failed to store user data in localStorage:', storageError);
        }
        toast.success('Login successful! 🎉');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }, []);

  // OAuth login — sets user state directly from token + user data (no API call)
  const loginWithToken = useCallback((token: string, userData: User) => {
    setUser(userData);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('commuteSmart_user', JSON.stringify(userData));
        localStorage.setItem('commuteSmart_token', token);
        console.log('Stored OAuth user data in localStorage');
      }
    } catch (storageError) {
      console.error('Failed to store OAuth user data:', storageError);
    }
    toast.success('Login successful! 🎉');
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await authAPI.register(email, password, name);
      
      // If verification is required, don't set user, just return the data to the component
      if (response.data.requiresVerification) {
        return response.data;
      }

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // Store user data in localStorage for persistence
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('commuteSmart_user', JSON.stringify(response.data.user));
            console.log('Stored user data in localStorage after registration');
          }
        } catch (storageError) {
          console.error('Failed to store user data in localStorage:', storageError);
        }
        toast.success('Registration successful! 🎉');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }, []);

  // Update user data in context and localStorage (e.g., after earning points)
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...userData };
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('commuteSmart_user', JSON.stringify(updated));
        }
      } catch (storageError) {
        console.error('Failed to update localStorage:', storageError);
      }
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Clear local state and localStorage
      setUser(null);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('commuteSmart_user');
          console.log('Cleared user data from localStorage after logout');
        }
      } catch (storageError) {
        console.error('Failed to clear localStorage:', storageError);
      }
      toast.success('Logged out successfully');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithToken,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // Check if localStorage is available
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedUser = localStorage.getItem('commuteSmart_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log('Loaded user from localStorage:', userData);
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        // Try to clear corrupted data
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('commuteSmart_user');
          }
        } catch (clearError) {
          console.error('Failed to clear localStorage:', clearError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Only check authentication status with backend if we have stored user data
  useEffect(() => {
    const storedUser = typeof window !== 'undefined' && window.localStorage ? 
      localStorage.getItem('commuteSmart_user') : null;
    
    if (storedUser) {
      // If we have stored user, verify with backend (don't duplicate — first useEffect already loaded from localStorage)
      verifyAuthWithBackend();
    }
  }, []);

  // Check authentication status with backend
  const checkAuth = async () => {
    try {
      const response = await authAPI.me();
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // Store user data in localStorage for persistence
        localStorage.setItem('commuteSmart_user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      // User is not authenticated, clear state and localStorage
      setUser(null);
      localStorage.removeItem('commuteSmart_user');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify auth with backend without clearing localStorage on failure
  const verifyAuthWithBackend = async () => {
    try {
      const response = await authAPI.me();
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // Update localStorage with fresh data
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('commuteSmart_user', JSON.stringify(response.data.user));
            console.log('Backend verification successful, updated user data in localStorage');
          }
        } catch (storageError) {
          console.error('Failed to update localStorage:', storageError);
        }
      } else {
        console.log('Backend verification failed, but keeping localStorage data');
      }
    } catch (error) {
      console.log('Backend verification failed, but keeping localStorage data:', error);
      // Don't clear localStorage on backend failure - user might still be valid
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await authAPI.register(email, password, name);
      
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

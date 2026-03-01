import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// CONNECTED TO BACKEND: Set global axios default for cookie handling
axios.defaults.withCredentials = true;

interface User {
  id: string;
  email: string;
  points: number;
  carbonSaved: number;
  badges: string[];
  honestyScore: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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
        const storedUser = localStorage.getItem('commuteSmart_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('commuteSmart_user');
      }
    };

    loadUserFromStorage();
    checkAuth();
  }, []);

  // Check authentication status with backend
  const checkAuth = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        withCredentials: true
      });
      
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // Store user data in localStorage for persistence
        localStorage.setItem('commuteSmart_user', JSON.stringify(response.data.user));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        email,
        password
      }, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // Store user data in localStorage for persistence
        localStorage.setItem('commuteSmart_user', JSON.stringify(response.data.user));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Clear local state and localStorage
      setUser(null);
      localStorage.removeItem('commuteSmart_user');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// CONNECTED TO BACKEND: Set global axios default for cookie handling
axios.defaults.withCredentials = true;

interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  co2Saved: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // CONNECTED TO BACKEND: Check authentication status on app load
    // Since we're using httpOnly cookies, we need to verify with the backend
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          withCredentials: true
        });
        setUser(response.data.user);
      } catch (error) {
        // User is not authenticated, clear state
        setUser(null);
        setToken(null);
      }
    };
    
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // CONNECTED TO BACKEND: Call real login API with axios and withCredentials
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true // Ensure cookies are sent and received
      });
      
      // User data will be managed by the JWT token in httpOnly cookie
      // Backend sends user data in response body
      setUser(response.data.user);
    } catch (error: any) {
      // CONNECTED TO BACKEND: Proper error handling with backend error messages
      const errorMessage = error.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      // CONNECTED TO BACKEND: Call real signup API with axios and withCredentials
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        name,
        email,
        password
      }, {
        withCredentials: true // Ensure cookies are sent and received
      });
      
      // User data will be managed by the JWT token in httpOnly cookie
      // Backend sends user data in response body
      setUser(response.data.user);
    } catch (error: any) {
      // CONNECTED TO BACKEND: Proper error handling with backend error messages
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // CONNECTED TO BACKEND: Call logout API to clear server-side session
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      // Even if logout API fails, clear local state
      console.error('Logout API failed:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
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

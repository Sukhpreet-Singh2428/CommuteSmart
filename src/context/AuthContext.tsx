import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

const MOCK_USER: User = {
  id: '1',
  name: 'Rahul Singh',
  email: 'rahul@example.com',
  xp: 1240,
  co2Saved: 45,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('commutesmart_token');
    if (t) {
      setToken(t);
      setUser(MOCK_USER);
    }
  }, []);

  const login = useCallback(async (_email: string, _password: string) => {
    // Stub: simulate API call
    await new Promise((r) => setTimeout(r, 500));
    const t = 'mock-jwt-token-' + Date.now();
    localStorage.setItem('commutesmart_token', t);
    setToken(t);
    setUser(MOCK_USER);
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 500));
    const t = 'mock-jwt-token-' + Date.now();
    localStorage.setItem('commutesmart_token', t);
    setToken(t);
    setUser({ ...MOCK_USER, name, email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('commutesmart_token');
    setToken(null);
    setUser(null);
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

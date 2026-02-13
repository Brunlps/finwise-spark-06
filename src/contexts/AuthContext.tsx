import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types/finance';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gerfinance_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulated auth
    await new Promise(r => setTimeout(r, 800));
    if (email && _password.length >= 4) {
      const u: User = { id: '1', name: email.split('@')[0], email };
      setUser(u);
      localStorage.setItem('gerfinance_user', JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('gerfinance_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

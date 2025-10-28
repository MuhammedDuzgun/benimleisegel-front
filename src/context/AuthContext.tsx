import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, SignupRequest } from '../types';
import { authService } from '../api/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id && parsedUser.email) {
            // Geçerli kullanıcı verisi varsa state'e ata
            setToken(storedToken);
            setUser(parsedUser);
          } else {
            // Geçersiz veri varsa temizle
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        // Hatalı JSON varsa localStorage'ı temizle
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // İlk yüklemede initialize et
    initializeAuth();

    // Storage değişikliklerini dinle (farklı sekmeler için)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user' || e.key === null) {
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const saveAuthData = (token: string, user: User) => {
    // Token'ı doğru formatta sakla
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    setToken(formattedToken);
    setUser(user);
    localStorage.setItem('token', formattedToken);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    saveAuthData(response.token, response.user);
  };

  const signup = async (data: SignupRequest) => {
    // Önce kayıt işlemini yap
    await authService.signup(data);
    // Kayıt başarılı ise otomatik login yap
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};


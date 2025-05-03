import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/config/api';

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Đăng nhập thất bại');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data);
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'There was an error logging in. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Đăng ký thất bại');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data);
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'There was an error creating your account. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  };

  const updateProfile = async (data: { displayName?: string }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Cập nhật thông tin thất bại');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin của bạn đã được cập nhật',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

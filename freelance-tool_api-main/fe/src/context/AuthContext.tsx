import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Define custom user type since we're not using Supabase anymore
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}

// Define custom session type
interface Session {
  token: string;
  expires_at: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string; address?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const storedSession = localStorage.getItem('session');
        const storedUser = localStorage.getItem('user');
        
        if (storedSession && storedUser) {
          const sessionObj = JSON.parse(storedSession);
          
          // Check if token is expired
          if (sessionObj.expires_at > Date.now()) {
            setSession(sessionObj);
            setUser(JSON.parse(storedUser));
          } else {
            // Clear expired session
            localStorage.removeItem('session');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign in');
      }
  
      const data = await response.json();
      console.log('Sign in data:', data);
      
      // Tạo session object
      const sessionObj: Session = {
        token: data.token,
        expires_at: Date.now() + 3600 * 1000, // Giả định token hết hạn sau 1 giờ (cần API cung cấp expiresIn)
      };
  
      // Tạo user object từ response
      const userObj: User = {
        id: data.userId,
        email: email,  // API không trả email, cần lấy từ input
        full_name: data.userName, // Nếu `userName` là tên đầy đủ
      };
      
      // Lưu vào state và localStorage
      setUser(userObj);
      setSession(sessionObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('session', JSON.stringify(sessionObj));
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Error signing in",
        description: error instanceof Error ? error.message : "There was an error signing in.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign up');
      }

      const data = await response.json();

      // Tạo user object từ API response
      const userObj: User = {
        id: data.id, 
        email: data.username, // Dùng đúng key từ API
      };
      
      // Tạo session object
      const sessionObj: Session = {
        token: data.token,
        expires_at: Date.now() + 3600 * 1000, // 1 giờ (giả định)
      };
      
      // Lưu vào state và localStorage
      setUser(userObj);
      setSession(sessionObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('session', JSON.stringify(sessionObj));
      
      
      toast({
        title: "Account created successfully",
        description: "Welcome to the application!",
      });
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: "Error creating account",
        description: error instanceof Error ? error.message : "There was an error creating your account.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Call API to invalidate token if needed
      if (session?.token) {
        await fetch(`${API_URL}/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        }).catch(err => console.error('Error calling signout endpoint:', err));
      }
      
      // Clear local storage and state
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      setUser(null);
      setSession(null);
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was an error signing out of your account.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (data: { full_name?: string; phone?: string; address?: string }) => {
    try {
      if (!session?.token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUserData = await response.json();
      
      // Update local user data
      const updatedUser = { ...user, ...updatedUserData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "There was an error updating your profile.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      if (!session?.token || !user?.id) {
        throw new Error('Not authenticated');
      }
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`${API_URL}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const data = await response.json();
      const avatarUrl = data.avatar_url;
      
      // Update local user data
      const updatedUser = { ...user, avatar_url: avatarUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      });

      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error uploading avatar",
        description: error instanceof Error ? error.message : "There was an error uploading your avatar.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    uploadAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
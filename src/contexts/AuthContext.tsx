
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE = 'http://localhost:8000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on app load
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.log('Not authenticated or connection failed');
    }
  };

  const login = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Get Google OAuth URL from backend
      const response = await fetch(`${API_BASE}/api/v1/auth/google`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get Google OAuth URL');
      }
      
      const { authorization_url, state } = await response.json();
      
      // Open Google OAuth in a popup
      const popup = window.open(
        authorization_url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup to close or receive auth result
      return new Promise((resolve, reject) => {
        // Listen for messages from the popup (callback handling)
        const messageListener = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            const { code, state: returnedState } = event.data;
            
            // Verify state matches
            if (returnedState !== state) {
              reject(new Error('Invalid state parameter'));
              return;
            }
            
            try {
              // Send callback data to backend
              const callbackResponse = await fetch(`${API_BASE}/api/v1/auth/google/callback`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ code, state: returnedState })
              });
              
              if (!callbackResponse.ok) {
                throw new Error('Authentication failed');
              }
              
              const authData = await callbackResponse.json();
              setUser(authData.user);
              
              popup?.close();
              window.removeEventListener('message', messageListener);
              setIsLoading(false);
              resolve();
            } catch (error) {
              popup?.close();
              window.removeEventListener('message', messageListener);
              setIsLoading(false);
              reject(error);
            }
          }
          
          if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            popup?.close();
            window.removeEventListener('message', messageListener);
            setIsLoading(false);
            reject(new Error(event.data.error || 'Authentication failed'));
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsLoading(false);
            reject(new Error('Authentication was cancelled'));
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          setIsLoading(false);
          reject(new Error('Authentication timeout'));
        }, 5 * 60 * 1000);
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

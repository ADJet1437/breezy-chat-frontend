import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, AuthCallbackResponse, getCurrentUser, refreshAccessToken } from '../utils/authApi';
import { getTokenExpiry, tokenExpiresWithin, getTokenInfo, isTokenExpired, getUserFromToken } from '../utils/tokenUtils';
import { setAuthRefreshFunction, setAuthLogoutFunction, setAuthUICallbacks, setAccessTokenFunction } from '../utils/authenticatedFetch';
import { handleAuthError, AuthError, showSuccessMessage, showWarningMessage } from '../utils/errorHandler';
import { buildApiUrl } from '../utils/apiConfig';

const ACCESS_TOKEN_KEY = 'talosy_access_token';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  authFunctionsReady: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  tokenExpiresAt: number | null;
  login: (authData: AuthCallbackResponse) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authFunctionsReady, setAuthFunctionsReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const navigate = useNavigate();

  const checkAuthStatus = async () => {
    setIsLoading(false);
    return;
  };

  const login = useCallback((authData: AuthCallbackResponse) => {
    setIsAuthenticated(true);
    setUser(authData.user);
    setAccessToken(authData.access_token);
    
    if (authData.access_token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
    }
    
    const expiryTime = getTokenExpiry(authData.access_token);
    setTokenExpiresAt(expiryTime);
  }, []);

  const getCurrentAccessToken = useCallback((): string | null => {
    return accessToken;
  }, [accessToken]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const logout = async () => {
    try {
      const { authenticatedPost } = await import('../utils/authenticatedFetch');
      await authenticatedPost(buildApiUrl('/api/v1/auth/logout'), undefined, {
        skipAuth: false
      });
    } catch (error) {
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      setTokenExpiresAt(null);
      
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      
      sessionStorage.removeItem('authSuccess');
      sessionStorage.removeItem('loginTimestamp');
      sessionStorage.removeItem('returnTo');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    if (savedToken) {
      if (!isTokenExpired(savedToken)) {
        setAccessToken(savedToken);
        setIsAuthenticated(true);
        
        const userInfo = getUserFromToken(savedToken);
        if (userInfo) {
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.email,
            avatar_url: null
          });
        }
        
        const expiryTime = getTokenExpiry(savedToken);
        setTokenExpiresAt(expiryTime);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setAuthRefreshFunction(refreshToken);
    setAuthLogoutFunction(logout);
    setAccessTokenFunction(getCurrentAccessToken);
    setAuthUICallbacks(
      () => setIsRefreshing(true),
      () => setIsRefreshing(false)
    );
    
    setAuthFunctionsReady(true);
  }, [refreshToken, getCurrentAccessToken]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      isRefreshing,
      authFunctionsReady,
      user,
      accessToken,
      tokenExpiresAt,
      login,
      logout,
      checkAuthStatus,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, AuthCallbackResponse, getCurrentUser, refreshAccessToken } from '../utils/authApi';
import { getTokenExpiry, tokenExpiresWithin, getTokenInfo, isTokenExpired, getUserFromToken } from '../utils/tokenUtils';
import { setAuthRefreshFunction, setAuthLogoutFunction, setAuthUICallbacks, setAccessTokenFunction } from '../utils/authenticatedFetch';
import { handleAuthError, AuthError, showSuccessMessage, showWarningMessage } from '../utils/errorHandler';

// localStorage key for token persistence
const ACCESS_TOKEN_KEY = 'talosy_access_token';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  // Debug: Log authentication state changes
  useEffect(() => {
    console.log('🔐 AUTH STATE CHANGED:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      hasToken: !!accessToken,
      userEmail: user?.email
    });
  }, [isAuthenticated, isLoading, user, accessToken]);

  const checkAuthStatus = async () => {
    // DISABLED - no longer calling /auth/me endpoint
    console.log('=== Auth Status Check DISABLED ===');
    setIsLoading(false);
    return;
    
    // try {
    //   console.log('=== Checking Auth Status ===');
    //   const userProfile = await getCurrentUser();
    //   console.log('Auth check successful, user:', userProfile);
    //   
    //   setIsAuthenticated(true);
    //   setUser(userProfile);
    //   
    //   // Note: We're using cookie-based auth, so we don't have access to the token
    //   // But we can set a default expiry check for periodic refresh
    //   setTokenExpiresAt(Date.now() + 30 * 60 * 1000); // Default: 30 minutes from now
    //   
    // } catch (error) {
    //   console.error('Auth check failed:', error);
    //   setIsAuthenticated(false);
    //   setUser(null);
    //   setAccessToken(null);
    //   setTokenExpiresAt(null);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const login = useCallback((authData: AuthCallbackResponse) => {
    console.log('🔐 === LOGIN CALLED ===');
    console.log('🔐 Auth data received:', {
      hasAccessToken: !!authData.access_token,
      hasRefreshToken: !!authData.refresh_token,
      hasUser: !!authData.user,
      user: authData.user
    });
    console.log('🔐 Token info:', getTokenInfo(authData.access_token));
    
    console.log('🔐 BEFORE: isAuthenticated =', isAuthenticated);
    
    setIsAuthenticated(true);
    setUser(authData.user);
    setAccessToken(authData.access_token);
    
    // Save token to localStorage for persistence
    if (authData.access_token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
      console.log('🔐 💾 TOKEN SAVED TO LOCALSTORAGE:', `${authData.access_token.substring(0, 30)}...`);
    }
    
    console.log('🔐 💾 TOKEN STORED IN STATE:', authData.access_token ? `${authData.access_token.substring(0, 30)}...` : 'NULL');
    
    const expiryTime = getTokenExpiry(authData.access_token);
    setTokenExpiresAt(expiryTime);
    
    console.log('🔐 AFTER: Setting isAuthenticated = true');
    console.log('🔐 Auth state should be updated:', {
      user: authData.user,
      tokenExpiresAt: expiryTime ? new Date(expiryTime) : null,
      isAuthenticated: true // This should now be true
    });
  }, []);

  // Function to get current access token for authenticated fetch
  const getCurrentAccessToken = useCallback((): string | null => {
    console.log('📋 getCurrentAccessToken CALLED, returning:', accessToken ? `TOKEN_EXISTS (${accessToken.substring(0, 20)}...)` : 'NULL');
    return accessToken;
  }, [accessToken]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    // DISABLED - no longer calling /auth/refresh endpoint
    console.log('=== Token Refresh DISABLED ===');
    return false;
    
    // try {
    //   console.log('=== Refreshing Access Token ===');
    //   const refreshResponse = await refreshAccessToken();
    //   
    //   setAccessToken(refreshResponse.access_token);
    //   const newExpiryTime = getTokenExpiry(refreshResponse.access_token);
    //   setTokenExpiresAt(newExpiryTime);
    //   
    //   console.log('Token refreshed successfully:', {
    //     tokenExpiresAt: newExpiryTime ? new Date(newExpiryTime) : null
    //   });
    //   
    //   return true;
    // } catch (error) {
    //   console.error('Token refresh failed:', error);
    //   
    //   // Handle different types of refresh failures
    //   if (error instanceof Error) {
    //     if (error.message.includes('401') || error.message.includes('unauthorized')) {
    //       handleAuthError(
    //         new AuthError('Your session has expired. Please sign in again.', 'TOKEN_EXPIRED'),
    //         'Session Refresh'
    //       );
    //     } else if (error.message.includes('network') || error.message.includes('fetch')) {
    //       showWarningMessage(
    //         'Connection Issue',
    //         'Unable to refresh session due to network issues. Please check your connection.'
    //       );
    //       // Don't logout on network errors, let user try again
    //       return false;
    //     } else {
    //       handleAuthError(
    //         new AuthError('Unable to refresh your session. Please sign in again.', 'REFRESH_FAILED'),
    //         'Session Refresh'
    //       );
    //     }
    //   } else {
    //     handleAuthError(error, 'Session Refresh');
    //   }
    //   
    //   // If refresh fails (except for network issues), clear auth state
    //   if (!error?.message?.includes('network') && !error?.message?.includes('fetch')) {
    //     setIsAuthenticated(false);
    //     setUser(null);
    //     setAccessToken(null);
    //     setTokenExpiresAt(null);
    //   }
    //   
    //   return false;
    // }
  }, []);

  const logout = async (showMessage: boolean = true) => {
    try {
      console.log('=== Logging Out ===');
      // Import dynamically to avoid circular dependency
      const { authenticatedPost } = await import('../utils/authenticatedFetch');
      await authenticatedPost('http://localhost:8000/api/v1/auth/logout', undefined, {
        skipAuth: false // Use both cookies and headers for logout
      });
      
      if (showMessage) {
        showSuccessMessage('Signed Out', 'You have been successfully signed out.');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Still proceed with local logout even if API fails
      if (showMessage) {
        showWarningMessage(
          'Logout Warning', 
          'You have been signed out locally, but there may have been an issue with the server.'
        );
      }
    } finally {
      console.log('Clearing auth state...');
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      setTokenExpiresAt(null);
      
      // Clear token from localStorage
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      console.log('🔐 🗑️ TOKEN CLEARED FROM LOCALSTORAGE');
      
      // Clear any stored session data
      sessionStorage.removeItem('authSuccess');
      sessionStorage.removeItem('loginTimestamp');
      sessionStorage.removeItem('returnTo');
    }
  };

  // Automatic token refresh mechanism - DISABLED
  // useEffect(() => {
  //   let refreshInterval: NodeJS.Timeout;
  //   
  //   if (isAuthenticated && tokenExpiresAt) {
  //     console.log('Setting up automatic token refresh...');
  //     
  //     // Check every 5 minutes if token needs refresh
  //     refreshInterval = setInterval(async () => {
  //       if (accessToken && tokenExpiresWithin(accessToken, 5)) {
  //         console.log('Token expires within 5 minutes, refreshing...');
  //         await refreshToken();
  //       }
  //     }, 5 * 60 * 1000); // 5 minutes
  //     
  //     // Also check immediately if current token needs refresh
  //     if (accessToken && tokenExpiresWithin(accessToken, 5)) {
  //       console.log('Token needs immediate refresh...');
  //       refreshToken();
  //     }
  //   }
  //   
  //   return () => {
  //     if (refreshInterval) {
  //       console.log('Clearing token refresh interval');
  //       clearInterval(refreshInterval);
  //     }
  //   };
  // }, [isAuthenticated, tokenExpiresAt, accessToken, refreshToken]);

  // Background token health monitoring - DISABLED
  // useEffect(() => {
  //   let healthCheckInterval: NodeJS.Timeout;
  //   
  //   if (isAuthenticated) {
  //     console.log('Setting up background token health monitoring...');
  //     
  //     // Check token health every 10 minutes
  //     healthCheckInterval = setInterval(async () => {
  //       try {
  //         console.log('Performing background auth health check...');
  //         await checkAuthStatus();
  //       } catch (error) {
  //         console.error('Background auth health check failed:', error);
  //       }
  //     }, 10 * 60 * 1000); // 10 minutes
  //   }
  //   
  //   return () => {
  //     if (healthCheckInterval) {
  //       console.log('Clearing auth health check interval');
  //       clearInterval(healthCheckInterval);
  //     }
  //   };
  // }, [isAuthenticated]);

  // Window focus refresh check - DISABLED
  // useEffect(() => {
  //   const handleWindowFocus = async () => {
  //     if (isAuthenticated && !document.hidden) {
  //       console.log('Window focused, checking auth status...');
  //       try {
  //         await checkAuthStatus();
  //       } catch (error) {
  //         console.error('Focus auth check failed:', error);
  //       }
  //     }
  //   };

  //   window.addEventListener('focus', handleWindowFocus);
  //   document.addEventListener('visibilitychange', handleWindowFocus);
  //   
  //   return () => {
  //     window.removeEventListener('focus', handleWindowFocus);
  //     document.removeEventListener('visibilitychange', handleWindowFocus);
  //   };
  // }, [isAuthenticated]);

  // Load token from localStorage on app initialization
  useEffect(() => {
    console.log('🔧 === INITIALIZING AUTH FROM LOCALSTORAGE ===');
    const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    if (savedToken) {
      console.log('🔐 📥 FOUND TOKEN IN LOCALSTORAGE:', `${savedToken.substring(0, 30)}...`);
      
      // Check if token is still valid
      if (!isTokenExpired(savedToken)) {
        console.log('🔐 ✅ TOKEN IS VALID - restoring authentication state');
        setAccessToken(savedToken);
        setIsAuthenticated(true);
        
        // Try to get user info from token
        const userInfo = getUserFromToken(savedToken);
        if (userInfo) {
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.email // Using email as name fallback
          });
        }
        
        // Set expiry time from token
        const expiryTime = getTokenExpiry(savedToken);
        setTokenExpiresAt(expiryTime);
      } else {
        console.log('🔐 ❌ TOKEN IS EXPIRED - clearing from storage');
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
      
      console.log('🔐 📥 TOKEN LOADED FROM LOCALSTORAGE - checking validity...');
    } else {
      console.log('🔐 📭 NO TOKEN FOUND IN LOCALSTORAGE');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Set up all auth functions for authenticated fetch
    console.log('🔧 === SETTING UP AUTH FUNCTIONS ===');
    console.log('🔧 Setting refresh function:', !!refreshToken);
    console.log('🔧 Setting logout function:', !!logout);
    console.log('🔧 Setting access token function:', !!getCurrentAccessToken);
    
    setAuthRefreshFunction(refreshToken);
    setAuthLogoutFunction(logout);
    setAccessTokenFunction(getCurrentAccessToken);
    setAuthUICallbacks(
      () => setIsRefreshing(true),
      () => setIsRefreshing(false)
    );
    
    console.log('🔧 Auth functions setup complete');
    // checkAuthStatus(); // DISABLED - no longer calling /auth/me
  }, [refreshToken, getCurrentAccessToken]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      isRefreshing,
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

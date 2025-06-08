/**
 * Authenticated fetch utility that automatically handles token refresh
 */

import { tokenExpiresWithin } from './tokenUtils';

// Global reference to auth context functions
let refreshTokenFn: (() => Promise<boolean>) | null = null;
let logoutFn: (() => void) | null = null;
let onRefreshStart: (() => void) | null = null;
let onRefreshEnd: (() => void) | null = null;
let getAccessTokenFn: (() => string | null) | null = null;

export const setAuthRefreshFunction = (refreshFn: () => Promise<boolean>) => {
  refreshTokenFn = refreshFn;
};

export const setAuthLogoutFunction = (logoutFunction: () => void) => {
  logoutFn = logoutFunction;
};

export const setAuthUICallbacks = (
  onStart: () => void,
  onEnd: () => void
) => {
  onRefreshStart = onStart;
  onRefreshEnd = onEnd;
};

export const setAccessTokenFunction = (getTokenFn: () => string | null) => {
  getAccessTokenFn = getTokenFn;
};

// Track ongoing refresh to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean; // Skip authentication for this request
}

const performTokenRefresh = async (): Promise<boolean> => {
  // If already refreshing, wait for the existing refresh
  if (isRefreshing && refreshPromise) {
    console.log('Token refresh already in progress, waiting...');
    return await refreshPromise;
  }

  if (!refreshTokenFn) {
    console.error('No refresh function available');
    return false;
  }

  isRefreshing = true;
  onRefreshStart?.();

  refreshPromise = (async () => {
    try {
      console.log('Starting token refresh...');
      const success = await refreshTokenFn();
      
      // Don't auto-logout if refresh is disabled (returns false)
      // The refresh function returning false means refresh is disabled, not that it failed
      if (!success) {
        console.log('Token refresh disabled or returned false - will not auto logout');
      }
      
      return success;
    } catch (error) {
      console.error('Token refresh failed with error:', error);
      // Only logout on actual errors, not when refresh is disabled
      logoutFn?.();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
      onRefreshEnd?.();
    }
  })();

  return await refreshPromise;
};

export const authenticatedFetch = async (
  url: string, 
  options: AuthenticatedFetchOptions = {},
  retryCount: number = 0
): Promise<Response> => {
  const { skipAuth = false, ...fetchOptions } = options;
  const maxRetries = 1;
  
  // If skipAuth is true, just use regular fetch with cookies
  if (skipAuth) {
    return fetch(url, {
      ...fetchOptions,
      credentials: 'include'
    });
  }

  // Proactive token refresh if needed (only on first attempt) - DISABLED
  // if (retryCount === 0 && refreshTokenFn) {
  //   try {
  //     await refreshTokenFn();
  //   } catch (error) {
  //     console.warn('Proactive token refresh failed, continuing with request:', error);
  //   }
  // }

  // Prepare headers with both Authorization and cookies for maximum compatibility
  console.log('🔍 === TOKEN RETRIEVAL DEBUG ===');
  console.log('🔍 getAccessTokenFn exists:', !!getAccessTokenFn);
  
  let accessToken = getAccessTokenFn?.();
  
  // Fallback: If no token from function, try localStorage directly
  if (!accessToken) {
    console.log('🔍 No token from getAccessTokenFn, falling back to localStorage');
    const localToken = localStorage.getItem('talosy_access_token');
    
    if (localToken) {
      accessToken = localToken;
      console.log('🔍 Using token from localStorage:', `EXISTS (${accessToken.substring(0, 20)}...)`);
    } else {
      console.log('🔍 No token in localStorage');
    }
  }
  
  console.log('🔍 Final accessToken:', accessToken ? `EXISTS (${accessToken.substring(0, 20)}...)` : 'NULL');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add Authorization header if token is available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    console.log('🔑 ✅ Authorization header ADDED:', `Bearer ${accessToken.substring(0, 20)}...`);
  } else {
    console.log('🔑 ❌ NO ACCESS TOKEN - Authorization header NOT ADDED');
    console.log('🔑 Will rely on cookies only');
  }

  console.log('🌐 Making authenticated request to:', url);
  console.log('🌐 Headers being sent:', Object.keys(headers));
  console.log('🌐 FULL HEADERS OBJECT:', headers);
  console.log('🌐 Credentials included:', true);

  // Make the request with both Authorization header and cookies for cross-origin compatibility
  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Always include cookies
    headers,
  });

  // Handle 401 responses with automatic retry
  if (response.status === 401 && retryCount < maxRetries) {
    console.log(`Got 401 on attempt ${retryCount + 1}, checking if refresh is available...`);
    
    // Check if refresh function is available and not disabled
    if (!refreshTokenFn) {
      console.log('No refresh function available, skipping retry for 401');
      return response;
    }
    
    console.log('Attempting token refresh...');
    const refreshSuccess = await performTokenRefresh();
    
    if (refreshSuccess) {
      console.log('Token refresh successful, retrying request...');
      // Retry the original request
      return authenticatedFetch(url, options, retryCount + 1);
    } else {
      console.log('Token refresh disabled or failed, returning 401 response without auto-logout');
      // Don't retry if refresh is disabled, just return the 401 response
      return response;
    }
  }

  // Handle other error responses
  if (!response.ok && response.status !== 401) {
    console.warn(`Request failed with status ${response.status}:`, {
      url,
      status: response.status,
      statusText: response.statusText
    });
  }

  return response;
};

// Convenience methods for common HTTP verbs
export const authenticatedGet = (url: string, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, { ...options, method: 'GET' });
};

export const authenticatedPost = (url: string, data?: any, options?: AuthenticatedFetchOptions) => {
  console.log('🚀 authenticatedPost CALLED');
  console.log('🚀 URL:', url);
  console.log('🚀 Data:', data);
  console.log('🚀 Options:', options);
  
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const authenticatedPut = (url: string, data?: any, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const authenticatedDelete = (url: string, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, { ...options, method: 'DELETE' });
};
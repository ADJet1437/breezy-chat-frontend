/**
 * Authenticated fetch utility that automatically handles token refresh
 */

import { tokenExpiresWithin } from './tokenUtils';

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

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

const performTokenRefresh = async (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) {
    return await refreshPromise;
  }

  if (!refreshTokenFn) {
    return false;
  }

  isRefreshing = true;
  onRefreshStart?.();

  refreshPromise = (async () => {
    try {
      const success = await refreshTokenFn();
      
      if (!success) {
      }
      
      return success;
    } catch (error) {
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
  
  if (skipAuth) {
    return fetch(url, {
      ...fetchOptions,
      credentials: 'include'
    });
  }

  let accessToken = getAccessTokenFn?.();
  
  if (!accessToken) {
    const localToken = localStorage.getItem('talosy_access_token');
    
    if (localToken) {
      accessToken = localToken;
    }
  }
  
  const headers: HeadersInit = {
    ...(fetchOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...fetchOptions.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && retryCount < maxRetries) {
    if (!refreshTokenFn) {
      return response;
    }
    
    const refreshSuccess = await performTokenRefresh();
    
    if (refreshSuccess) {
      return authenticatedFetch(url, options, retryCount + 1);
    } else {
      return response;
    }
  }

  return response;
};

export const authenticatedGet = (url: string, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, { ...options, method: 'GET' });
};

export const authenticatedPost = (url: string, data?: any, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  });
};

export const authenticatedPut = (url: string, data?: any, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  });
};

export const authenticatedPatch = (url: string, data?: any, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'PATCH',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  });
};

export const authenticatedDelete = (url: string, options?: AuthenticatedFetchOptions) => {
  return authenticatedFetch(url, { ...options, method: 'DELETE' });
};

import { getBackendUrl, buildApiUrl } from './apiConfig';

const BASE_URL = getBackendUrl();

export interface GoogleAuthResponse {
  authorization_url: string;
  state: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface AuthCallbackResponse {
  access_token: string;
  refresh_token?: string;
  user: UserProfile;
}

export const initiateGoogleAuth = async (): Promise<GoogleAuthResponse> => {
  console.log('=== Initiating Google Auth ===');
  console.log('Making request to:', buildApiUrl('/api/v1/auth/google'));
  
  const response = await fetch(buildApiUrl('/api/v1/auth/google'), {
    method: 'GET',
    credentials: 'include',
  });

  console.log('Auth initiation response status:', response.status);
  console.log('Auth initiation response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Auth initiation failed:', errorText);
    throw new Error('Failed to initiate Google authentication');
  }

  const data = await response.json();
  console.log('Auth initiation successful, data:', data);
  return data;
};

export const handleGoogleCallback = async (code: string, state: string): Promise<AuthCallbackResponse> => {
  console.log('=== Handling Google Callback ===');
  console.log('Making request to:', buildApiUrl('/api/v1/auth/google/callback'));
  console.log('Payload:', { code: `${code.substring(0, 10)}...`, state });
  
  const response = await fetch(buildApiUrl('/api/v1/auth/google/callback'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code, state }),
  });

  console.log('Callback response status:', response.status);
  console.log('Callback response headers:', Object.fromEntries(response.headers.entries()));
  console.log('Callback response URL:', response.url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Callback failed, response text:', errorText);
    
    try {
      const errorData = JSON.parse(errorText);
      console.error('Parsed error data:', errorData);
      throw new Error(errorData.detail || errorData.message || 'Authentication failed');
    } catch (parseError) {
      console.error('Could not parse error response as JSON');
      throw new Error(`Authentication failed with status ${response.status}`);
    }
  }

  const data = await response.json();
  console.log('Callback successful, parsed response:', data);
  
  // Validate response structure
  if (!data.access_token || !data.user) {
    console.error('Invalid callback response structure:', data);
    throw new Error('Invalid authentication response from server');
  }
  
  console.log('Tokens extracted successfully:', {
    access_token: `${data.access_token.substring(0, 10)}...`,
    refresh_token: data.refresh_token ? `${data.refresh_token.substring(0, 10)}...` : 'not_provided',
    user: data.user
  });
  
  return data as AuthCallbackResponse;
};

export interface RefreshTokenResponse {
  access_token: string;
}

export const refreshAccessToken = async (): Promise<RefreshTokenResponse> => {
  console.log('=== Refreshing Access Token ===');
  
  const response = await fetch(buildApiUrl('/api/v1/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send refresh token via cookie
  });

  console.log('Refresh response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', errorText);
    
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.detail || errorData.message || 'Token refresh failed');
    } catch (parseError) {
      throw new Error(`Token refresh failed with status ${response.status}`);
    }
  }

  const data = await response.json();
  console.log('Token refresh successful:', {
    access_token: `${data.access_token.substring(0, 10)}...`
  });
  
  return data as RefreshTokenResponse;
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  console.log('=== Getting Current User ===');
  
  // Import dynamically to avoid circular dependency
  const { authenticatedGet } = await import('./authenticatedFetch');
  
  const response = await authenticatedGet(buildApiUrl('/api/v1/auth/me'), {
    skipAuth: false // Use authentication with both cookies and headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Get current user failed:', errorText);
    throw new Error('Failed to get current user');
  }

  const data = await response.json();
  console.log('Current user retrieved:', data);
  
  return data as UserProfile;
};

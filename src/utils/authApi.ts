
const BASE_URL = 'http://localhost:8000';

export interface GoogleAuthResponse {
  authorization_url: string;
  state: string;
}

export const initiateGoogleAuth = async (): Promise<GoogleAuthResponse> => {
  const response = await fetch(`${BASE_URL}/api/v1/auth/google`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to initiate Google authentication');
  }

  return response.json();
};

export const handleGoogleCallback = async (code: string, state: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/v1/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Authentication failed');
  }

  return response.json();
};

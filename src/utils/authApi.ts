
const BASE_URL = 'http://localhost:8000';

export interface GoogleAuthResponse {
  authorization_url: string;
  state: string;
}

export const initiateGoogleAuth = async (): Promise<GoogleAuthResponse> => {
  console.log('=== Initiating Google Auth ===');
  console.log('Making request to:', `${BASE_URL}/api/v1/auth/google`);
  
  const response = await fetch(`${BASE_URL}/api/v1/auth/google`, {
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

export const handleGoogleCallback = async (code: string, state: string): Promise<void> => {
  console.log('=== Handling Google Callback ===');
  console.log('Making request to:', `${BASE_URL}/api/v1/auth/google/callback`);
  console.log('Payload:', { code: `${code.substring(0, 10)}...`, state });
  
  const response = await fetch(`${BASE_URL}/api/v1/auth/google/callback`, {
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
      throw new Error(errorData.message || 'Authentication failed');
    } catch (parseError) {
      console.error('Could not parse error response as JSON');
      throw new Error(`Authentication failed with status ${response.status}`);
    }
  }

  const responseText = await response.text();
  console.log('Callback successful, response text:', responseText);
  
  if (responseText) {
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed callback response:', data);
      return data;
    } catch (parseError) {
      console.error('Could not parse success response as JSON:', responseText);
    }
  }
  
  return;
};

/**
 * Token utility functions for JWT parsing and expiration checking
 */

interface JWTPayload {
  sub: string; // User ID
  email: string;
  type: 'access_token' | 'refresh_token';
  exp: number; // Expiration timestamp
  iat?: number; // Issued at timestamp
}

/**
 * Decode JWT token without verification (for client-side expiration checking)
 * Note: This only decodes the payload, doesn't verify signature
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    if (!token) return null;
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  // Convert exp from seconds to milliseconds and compare with current time
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpiry = (token: string | null): number | null => {
  if (!token) return null;
  
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;
  
  // Convert from seconds to milliseconds
  return payload.exp * 1000;
};

/**
 * Check if token expires within specified minutes
 */
export const tokenExpiresWithin = (token: string | null, minutes: number): boolean => {
  if (!token) return true;
  
  const expiryTime = getTokenExpiry(token);
  if (!expiryTime) return true;
  
  const currentTime = Date.now();
  const thresholdTime = currentTime + (minutes * 60 * 1000);
  
  return expiryTime <= thresholdTime;
};

/**
 * Get time remaining until token expires (in minutes)
 */
export const getTokenTimeRemaining = (token: string | null): number => {
  if (!token) return 0;
  
  const expiryTime = getTokenExpiry(token);
  if (!expiryTime) return 0;
  
  const currentTime = Date.now();
  const timeRemaining = expiryTime - currentTime;
  
  // Return minutes (can be negative if expired)
  return Math.floor(timeRemaining / (60 * 1000));
};

/**
 * Extract user information from JWT token
 */
export const getUserFromToken = (token: string | null): { id: string; email: string } | null => {
  if (!token) return null;
  
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  return {
    id: payload.sub,
    email: payload.email
  };
};

/**
 * Validate token type
 */
export const isAccessToken = (token: string | null): boolean => {
  if (!token) return false;
  
  const payload = decodeJWT(token);
  return payload?.type === 'access_token';
};

export const isRefreshToken = (token: string | null): boolean => {
  if (!token) return false;
  
  const payload = decodeJWT(token);
  return payload?.type === 'refresh_token';
};

/**
 * Get readable expiration info for debugging
 */
export const getTokenInfo = (token: string | null): string => {
  if (!token) return 'No token';
  
  const payload = decodeJWT(token);
  if (!payload) return 'Invalid token';
  
  const expiryTime = new Date(payload.exp * 1000);
  const timeRemaining = getTokenTimeRemaining(token);
  const isExpired = isTokenExpired(token);
  
  return `Type: ${payload.type}, Expires: ${expiryTime.toLocaleString()}, Remaining: ${timeRemaining}min, Expired: ${isExpired}`;
};
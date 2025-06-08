// Backend URL configuration
declare const __TALOSY_BACKEND_HOST__: string;

// Get the backend URL from Vite's define configuration
// This includes the full URL with scheme (e.g., http://localhost:8000)
export const getBackendUrl = (): string => {
  return __TALOSY_BACKEND_HOST__;
};

// Helper function to build API endpoints
export const buildApiUrl = (path: string): string => {
  const baseUrl = getBackendUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};
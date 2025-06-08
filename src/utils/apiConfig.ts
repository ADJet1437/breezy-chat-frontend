// Backend URL configuration
// Get the backend URL from Vite's environment variables
// This includes the full URL with scheme (e.g., http://localhost:8000)
export const getBackendUrl = (): string => {
  return import.meta.env.VITE_TALOSY_BACKEND_HOST || 'http://localhost:8000';
};

// Helper function to build API endpoints
export const buildApiUrl = (path: string): string => {
  const baseUrl = getBackendUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};
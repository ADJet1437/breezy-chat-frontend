/**
 * Centralized error handling and user feedback system
 */

interface ErrorNotification {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  duration?: number;
}

// Global reference to toast function
let globalToast: ((notification: ErrorNotification) => void) | null = null;

export const setGlobalToast = (toastFn: (notification: ErrorNotification) => void) => {
  globalToast = toastFn;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class PaymentRequiredError extends Error {
  constructor(
    message: string,
    public errorCode: string,
    public statusCode: number = 402
  ) {
    super(message);
    this.name = 'PaymentRequiredError';
  }
}

export const handleAuthError = (error: unknown, context: string = 'Authentication') => {
  console.error(`${context} error:`, error);
  
  let errorMessage = 'An unexpected error occurred';
  let errorTitle = `${context} Failed`;
  
  if (error instanceof AuthError) {
    switch (error.code) {
      case 'TOKEN_EXPIRED':
        errorMessage = 'Your session has expired. Please sign in again.';
        errorTitle = 'Session Expired';
        break;
      case 'REFRESH_FAILED':
        errorMessage = 'Unable to refresh your session. Please sign in again.';
        errorTitle = 'Session Refresh Failed';
        break;
      case 'INVALID_CREDENTIALS':
        errorMessage = 'Invalid credentials provided.';
        errorTitle = 'Authentication Failed';
        break;
      default:
        errorMessage = error.message;
    }
  } else if (error instanceof NetworkError) {
    errorMessage = 'Network connection failed. Please check your internet connection.';
    errorTitle = 'Connection Error';
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  globalToast?.({
    title: errorTitle,
    description: errorMessage,
    variant: 'destructive',
    duration: 5000,
  });
};

export const handleApiError = async (response: Response, context: string = 'API Request') => {
  if (response.ok) return;
  
  let errorMessage = `Request failed with status ${response.status}`;
  let errorData: any = null;
  
  try {
    errorData = await response.json();
    if (errorData.detail) {
      // Handle structured error response (object with error_code and message)
      if (typeof errorData.detail === 'object' && errorData.detail.message) {
        errorMessage = errorData.detail.message;
      } else {
        errorMessage = errorData.detail;
      }
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
  } catch {
    // Failed to parse error response, use generic message
  }
  
  if (response.status === 401) {
    throw new AuthError(errorMessage, 'UNAUTHORIZED', 401);
  } else if (response.status === 402) {
    const errorCode = errorData?.detail?.error_code || 'PAYMENT_REQUIRED';
    throw new PaymentRequiredError(errorMessage, errorCode, 402);
  } else if (response.status === 403) {
    throw new AuthError('You do not have permission to perform this action', 'FORBIDDEN', 403);
  } else if (response.status >= 500) {
    throw new NetworkError('Server error occurred. Please try again later.', response.status);
  } else {
    throw new Error(errorMessage);
  }
};

export const showSuccessMessage = (title: string, description: string) => {
  globalToast?.({
    title,
    description,
    variant: 'default',
    duration: 3000,
  });
};

export const showInfoMessage = (description: string, duration: number = 2000) => {
  globalToast?.({
    title: 'Info',
    description,
    variant: 'default',
    duration,
  });
};

export const showWarningMessage = (title: string, description: string) => {
  globalToast?.({
    title,
    description,
    variant: 'destructive',
    duration: 4000,
  });
};

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home, HelpCircle } from 'lucide-react';
import '../../styles/auth-styles.css';

const AuthErrorDisplay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const error = location.state?.error || 'unknown_error';
  const message = location.state?.message || 'We encountered an unexpected error during authentication.';

  const errorMessages: Record<string, string> = {
    'access_denied': 'You denied access to your Google account. Please try again and allow access to continue.',
    'invalid_request': 'The authentication request was invalid. Please try signing in again.',
    'invalid_client': 'There was a configuration error. Please contact support.',
    'invalid_grant': 'The authorization code has expired. Please try signing in again.',
    'unsupported_response_type': 'Authentication method not supported. Please contact support.',
    'invalid_scope': 'Permission scope error. Please contact support.',
    'server_error': 'Google\'s servers are experiencing issues. Please try again later.',
    'temporarily_unavailable': 'Authentication service is temporarily unavailable. Please try again later.',
    'callback_failed': 'Failed to process authentication response. Please try again.',
    'user_not_found': 'User account not found. Please contact support.',
    'account_deactivated': 'Your account has been deactivated. Please contact support.',
    'authentication_failed': 'Authentication failed. Please try again.'
  };

  const displayMessage = errorMessages[error] || message;

  const tryAgain = () => {
    navigate('/auth/login');
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="error-content">
          {/* Error Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--auth-danger-color), #ff6b6b)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--auth-space-xl)'
          }}>
            <AlertTriangle size={32} color="white" />
          </div>
          
          {/* Error Message */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--auth-space-xl)' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: 'var(--auth-gray-900)', 
              marginBottom: 'var(--auth-space-md)' 
            }}>
              Oops! Something went wrong
            </h1>
            <p style={{ 
              color: 'var(--auth-gray-600)', 
              fontSize: '1.125rem', 
              lineHeight: '1.6' 
            }}>
              {displayMessage}
            </p>
          </div>
          
          {/* Error Details */}
          {error && (
            <div style={{
              background: 'var(--auth-gray-100)',
              padding: 'var(--auth-space-md)',
              borderRadius: 'var(--auth-radius-md)',
              marginBottom: 'var(--auth-space-xl)',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: "'Monaco', 'Menlo', monospace",
                fontSize: '0.875rem',
                color: 'var(--auth-gray-600)'
              }}>
                Error Code: {error}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--auth-space-md)',
            justifyContent: 'center',
            marginBottom: 'var(--auth-space-xl)'
          }}>
            <button 
              className="auth-btn auth-btn-primary" 
              onClick={tryAgain}
            >
              <RotateCcw />
              Try Again
            </button>
            <button 
              className="auth-btn auth-btn-outline" 
              onClick={goHome}
            >
              <Home />
              Go to Home
            </button>
          </div>
          
          {/* Help Section */}
          <div>
            <details style={{
              border: '1px solid var(--auth-gray-200)',
              borderRadius: 'var(--auth-radius-md)',
              overflow: 'hidden'
            }}>
              <summary style={{
                padding: 'var(--auth-space-md)',
                background: 'var(--auth-gray-50)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--auth-space-sm)',
                fontWeight: '500',
                color: 'var(--auth-gray-700)'
              }}>
                <HelpCircle size={16} />
                Need help? Common solutions
              </summary>
              <div style={{ padding: 'var(--auth-space-md)' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  <li style={{ 
                    padding: 'var(--auth-space-sm) 0', 
                    borderBottom: '1px solid var(--auth-gray-200)' 
                  }}>
                    <strong>Browser Issues:</strong> Clear your browser cache and cookies, then try again.
                  </li>
                  <li style={{ 
                    padding: 'var(--auth-space-sm) 0', 
                    borderBottom: '1px solid var(--auth-gray-200)' 
                  }}>
                    <strong>Google Account:</strong> Make sure you're signed into the correct Google account.
                  </li>
                  <li style={{ 
                    padding: 'var(--auth-space-sm) 0', 
                    borderBottom: '1px solid var(--auth-gray-200)' 
                  }}>
                    <strong>Network Issues:</strong> Check your internet connection and try refreshing the page.
                  </li>
                  <li style={{ padding: 'var(--auth-space-sm) 0' }}>
                    <strong>Third-party Cookies:</strong> Ensure third-party cookies are enabled for authentication.
                  </li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
      
      {/* Background Elements */}
      <div className="auth-bg-elements">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
        <div className="auth-bg-circle auth-bg-circle-3"></div>
      </div>
    </div>
  );
};

export default AuthErrorDisplay;

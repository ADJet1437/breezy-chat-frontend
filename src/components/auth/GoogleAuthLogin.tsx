
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth-styles.css';

const GoogleAuthLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleAuth = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Simulate Google OAuth flow
      const mockEmail = 'demo@example.com';
      navigate('/auth/loading', { 
        state: { email: mockEmail, step: 'oauth' } 
      });
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const closeError = () => {
    setError(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo and Title */}
        <div className="auth-header">
          <div className="auth-logo">
            <Shield />
          </div>
          <h1>Welcome to Auth Demo</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>
        
        {/* Sign In Form */}
        <div className="auth-form">
          {/* Google Sign In Button */}
          <button 
            className="google-btn" 
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <div className="google-btn-content">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </div>
          </button>
          
          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>
          
          {/* Alternative Sign In Info */}
          <div className="alt-signin">
            <p className="info-text" style={{ color: 'var(--auth-gray-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} />
              Use your Google account to sign in securely
            </p>
          </div>
        </div>
        
        {/* Security Info */}
        <div className="security-info">
          <div className="security-features">
            <div className="security-feature">
              <Lock />
              <span>Secure OAuth 2.0</span>
            </div>
            <div className="security-feature">
              <Shield />
              <span>Privacy Protected</span>
            </div>
            <div className="security-feature">
              <Key />
              <span>No Password Storage</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Elements */}
      <div className="auth-bg-elements">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
        <div className="auth-bg-circle auth-bg-circle-3"></div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Authentication Error</h3>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-end">
              <button 
                onClick={closeError}
                className="auth-btn auth-btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthLogin;

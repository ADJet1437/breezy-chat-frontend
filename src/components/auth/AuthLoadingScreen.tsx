
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth-styles.css';

const AuthLoadingScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [subtitle, setSubtitle] = useState('Please wait while we verify your credentials...');
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If user becomes authenticated, navigate to dashboard
    if (user && !isLoading) {
      setCurrentStep(3);
      setProgress(100);
      setSubtitle('Success! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/auth/dashboard');
      }, 1000);
      return;
    }

    // If not loading and no user, there might be an error
    if (!isLoading && !user) {
      setTimeout(() => {
        navigate('/auth/error', { 
          state: { 
            error: 'authentication_failed',
            message: 'Authentication process was interrupted. Please try again.'
          } 
        });
      }, 2000);
      return;
    }

    const updateProgress = () => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5;
        
        if (newProgress > 30 && currentStep === 1) {
          setCurrentStep(2);
          setSubtitle('Establishing secure connection...');
        } else if (newProgress > 70 && currentStep === 2) {
          setCurrentStep(3);
          setSubtitle('Finalizing authentication...');
        }
        
        return Math.min(newProgress, 95); // Don't reach 100% unless actually complete
      });
    };

    const interval = setInterval(updateProgress, 200 + Math.random() * 300);
    return () => clearInterval(interval);
  }, [user, isLoading, navigate, currentStep]);

  return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="loading-content">
          {/* Animated Logo */}
          <div className="loading-logo">
            <div className="logo-spinner">
              <Shield />
            </div>
          </div>
          
          {/* Loading Text */}
          <div className="loading-text">
            <h2>Processing Authentication</h2>
            <p className="loading-subtitle">{subtitle}</p>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-steps">
              <span className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
                Verifying
              </span>
              <span className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                Authenticating
              </span>
              <span className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
                Redirecting
              </span>
            </div>
          </div>
          
          {/* Loading Animation */}
          <div className="loading-animation">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
      </div>
      
      {/* Background Animation */}
      <div className="auth-bg-elements">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
        <div className="auth-bg-circle auth-bg-circle-3"></div>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;

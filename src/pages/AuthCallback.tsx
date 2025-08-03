
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleGoogleCallback } from '../utils/authApi';
import { useToast } from '@/hooks/use-toast';
import LoadingLogo from '../components/LoadingLogo';
import LoadingProgress from '../components/LoadingProgress';
import LoadingAnimation from '../components/LoadingAnimation';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [statusText, setStatusText] = useState('Please wait while we verify your credentials...');
  const hasExecuted = useRef(false);

  // Progress simulation effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isProcessing) {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 15 + 5; // Random increment between 5-20
          const newProgress = Math.min(prev + increment, 95); // Stop at 95% until completion
          
          // Update steps and status text based on progress
          if (newProgress > 30 && currentStep === 1) {
            setCurrentStep(2);
            setStatusText('Establishing secure connection...');
          } else if (newProgress > 70 && currentStep === 2) {
            setCurrentStep(3);
            setStatusText('Almost done, redirecting...');
          }
          
          return newProgress;
        });
      }, 200 + Math.random() * 300); // Random interval between 200-500ms
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isProcessing, currentStep]);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent multiple executions
      if (hasExecuted.current) {
        console.log('🔒 OAuth callback already executed, skipping...');
        return;
      }
      hasExecuted.current = true;

      try {
        console.log('=== OAuth Callback Started ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        console.log('Extracted code:', code ? `${code.substring(0, 10)}...` : 'null');
        console.log('Extracted state:', state);

        if (!code) {
          throw new Error('Missing authentication code from Google OAuth');
        }

        // Wait a bit for progress animation to show
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('📞 Calling handleGoogleCallback...');
        const authData = await handleGoogleCallback(code, state || '');
        console.log('📞 Backend response:', authData);
        
        console.log('📞 CALLING LOGIN() with auth data...');
        console.log('📞 Auth data structure:', {
          hasAccessToken: !!authData.access_token,
          hasRefreshToken: !!authData.refresh_token,
          hasUser: !!authData.user,
          accessTokenPreview: authData.access_token ? `${authData.access_token.substring(0, 20)}...` : 'none',
          userEmail: authData.user?.email
        });
        
        login(authData);
        
        console.log('📞 LOGIN() called successfully');
        
        // Store session information
        sessionStorage.setItem('authSuccess', 'true');
        sessionStorage.setItem('loginTimestamp', Date.now().toString());
        
        // Complete the progress
        setProgress(100);
        setStatusText('Success! Redirecting to dashboard...');
        
        console.log('📞 Checking if this is a popup window...');
        
        // Check if this is running in a popup window
        if (window.opener && window.opener !== window) {
          console.log('📞 Running in popup - sending message to parent window');
          
          // Send success message to parent window
          try {
            window.opener.postMessage({
              type: 'TALOSY_AUTH_SUCCESS',
              authData: authData
            }, window.location.origin);
            
            console.log('📞 Message sent to parent window, closing popup');
            
            // Close the popup
            setTimeout(() => {
              window.close();
            }, 1000);
          } catch (error) {
            console.error('📞 Failed to communicate with parent window:', error);
            // Fallback: redirect in popup
            setTimeout(() => {
              navigate('/');
            }, 1000);
          }
        } else {
          console.log('📞 Running in main window - normal redirect');

          // Wait a bit to show completion before redirect
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }

      } catch (error) {
        console.error('=== Authentication callback failed ===');
        console.error('Error details:', error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Current URL when error occurred:', window.location.href);
        
        setProgress(100);
        setStatusText('Authentication failed...');
        
        // Handle error in popup vs main window
        if (window.opener && window.opener !== window) {
          console.log('📞 Error in popup - sending error message to parent');
          
          try {
            window.opener.postMessage({
              type: 'TALOSY_AUTH_ERROR',
              error: error instanceof Error ? error.message : 'Authentication failed'
            }, window.location.origin);
            
            setTimeout(() => {
              window.close();
            }, 2000);
          } catch (commError) {
            console.error('📞 Failed to communicate error to parent:', commError);
            setTimeout(() => {
              window.close();
            }, 2000);
          }
        } else {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: error instanceof Error ? error.message : "Unable to complete sign in. Please try again.",
            duration: 5000,
          });

          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } finally {
        console.log('=== OAuth Callback Finished ===');
        setTimeout(() => {
          setIsProcessing(false);
        }, 1500);
      }
    };

    processCallback();
  }, [searchParams, navigate, login, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Animation */}
        <LoadingAnimation />
        
        {/* Main Loading Card */}
        <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Animated Logo */}
            <LoadingLogo />
            
            {/* Loading Text */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Processing Authentication</h2>
              <p className="text-gray-600 animate-pulse">{statusText}</p>
            </div>
            
            {/* Progress Bar and Steps */}
            <LoadingProgress progress={progress} currentStep={currentStep} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;

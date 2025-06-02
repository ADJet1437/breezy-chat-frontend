
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleGoogleCallback } from '../utils/authApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          throw new Error('Missing authentication parameters');
        }

        await handleGoogleCallback(code, state);
        
        login();
        
        // Check if we're in a popup window
        const isPopup = window.opener && window.opener !== window;
        
        if (isPopup) {
          // Close the popup and let the parent window handle the success
          window.close();
        } else {
          // If not in popup, show toast and redirect normally
          toast({
            description: "Successfully signed in!",
            duration: 3000,
          });

          // Redirect to the page they were on before login
          const returnTo = sessionStorage.getItem('returnTo') || '/';
          sessionStorage.removeItem('returnTo');
          navigate(returnTo);
        }

      } catch (error) {
        console.error('Authentication callback failed:', error);
        
        const isPopup = window.opener && window.opener !== window;
        
        if (isPopup) {
          // If in popup, close it - the parent window should handle the error
          window.close();
        } else {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: error instanceof Error ? error.message : "Unable to complete sign in. Please try again.",
            duration: 5000,
          });

          navigate('/');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, login, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Completing sign in...</h2>
          <p className="text-gray-600">Please wait while we authenticate your account.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;

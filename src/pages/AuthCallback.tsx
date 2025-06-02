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
        console.log('=== OAuth Callback Started ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        console.log('Extracted code:', code ? `${code.substring(0, 10)}...` : 'null');
        console.log('Extracted state:', state);

        if (!code || !state) {
          throw new Error('Missing authentication parameters');
        }

        console.log('Calling handleGoogleCallback...');
        const response = await handleGoogleCallback(code, state);
        console.log('Backend response:', response);
        
        console.log('Calling login() to update auth state...');
        login();
        
        console.log('Redirecting to home page...');
        toast({
          description: "Successfully signed in!",
          duration: 3000,
        });

        navigate('/');

      } catch (error) {
        console.error('=== Authentication callback failed ===');
        console.error('Error details:', error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Current URL when error occurred:', window.location.href);
        
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : "Unable to complete sign in. Please try again.",
          duration: 5000,
        });

        navigate('/');
      } finally {
        console.log('=== OAuth Callback Finished ===');
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

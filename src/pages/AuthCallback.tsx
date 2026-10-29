import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleGoogleCallback } from '../utils/authApi';
import { useToast } from '@/hooks/use-toast';

/**
 * The OAuth return leg.
 *
 * It used to run a fake progress bar -- a simulated percentage on a random
 * interval, three invented "steps", and a one-second sleep before the real
 * request so the animation had time to show. All of it has gone: the callback
 * now does its work and leaves as soon as it is done, which is faster in every
 * case and honest about how long it actually took.
 */
const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const hasExecuted = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // React 18 mounts effects twice in development; the code is single-use.
      if (hasExecuted.current) return;
      hasExecuted.current = true;

      const inPopup = window.opener && window.opener !== window;

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          throw new Error('Missing authentication code from Google OAuth');
        }

        const authData = await handleGoogleCallback(code, state || '');
        login(authData);

        sessionStorage.setItem('authSuccess', 'true');
        sessionStorage.setItem('loginTimestamp', Date.now().toString());

        if (inPopup) {
          try {
            window.opener.postMessage(
              { type: 'TALOSY_AUTH_SUCCESS', authData },
              window.location.origin,
            );
            window.close();
          } catch (error) {
            console.error('Failed to reach the opener window:', error);
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('OAuth callback failed:', error);

        if (inPopup) {
          try {
            window.opener.postMessage(
              {
                type: 'TALOSY_AUTH_ERROR',
                error: error instanceof Error ? error.message : 'Authentication failed',
              },
              window.location.origin,
            );
          } catch (commError) {
            console.error('Failed to reach the opener window:', commError);
          }
          window.close();
        } else {
          toast({
            variant: 'destructive',
            title: 'Authentication Failed',
            description:
              error instanceof Error
                ? error.message
                : 'Unable to complete sign in. Please try again.',
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    );
  }

  return null;
};

export default AuthCallback;

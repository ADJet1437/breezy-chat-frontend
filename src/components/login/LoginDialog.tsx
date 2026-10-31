import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { initiateGoogleAuth } from '../../utils/authApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import EmailLoginForm from './EmailLoginForm';
import EmailRegisterForm from './EmailRegisterForm';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMethod = 'selection' | 'email-login' | 'email-register';

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('selection');
  const [authError, setAuthError] = useState<string>('');
  const { toast } = useToast();
  const { login, loginWithEmailPassword, registerWithEmailPassword } = useAuth();

  // Reset to selection view when dialog opens
  useEffect(() => {
    if (open) {
      setAuthMethod('selection');
      setIsLoading(false);
      setAuthError('');
    }
  }, [open]);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Not ours: the window receives messages from anything embedded in
      // it, and a generated app in a sandboxed frame posts one per API
      // call from an opaque origin. Checking shape first means the origin
      // warning fires for an auth message from the wrong place — which is
      // worth seeing — rather than for every row a table loads.
      if (event.data?.type !== 'TALOSY_AUTH_SUCCESS') return;

      // Verify origin for security
      if (event.origin !== window.location.origin) {
        console.warn('🚨 Received auth message from unexpected origin:', event.origin);
        return;
      }

      console.log('📨 Received message in main window:', event.data);

      if (event.data.type === 'TALOSY_AUTH_SUCCESS') {
        console.log('📨 Processing auth success from popup');
        
        try {
          // Call login with the auth data from popup
          login(event.data.authData);
          
          console.log('📨 Login called successfully in main window');
          
          // Close the login dialog
          onOpenChange(false);
          setIsLoading(false);
          
        } catch (error) {
          console.error('📨 Failed to process auth success:', error);
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Failed to complete sign in. Please try again.",
            duration: 5000,
          });
        }
      } else if (event.data.type === 'TALOSY_AUTH_ERROR') {
        console.log('📨 Processing auth error from popup');
        
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: event.data.error || "Unable to complete sign in. Please try again.",
          duration: 5000,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [login, onOpenChange, toast]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Store current location for redirect after login
      sessionStorage.setItem('returnTo', window.location.pathname);
      
      console.log('Initiating Google auth...');
      const response = await initiateGoogleAuth();
      console.log('Auth response:', response);
      
      const { authorization_url } = response;
      
      if (!authorization_url) {
        throw new Error('No authorization URL received from server');
      }
      
      console.log('Opening popup with URL:', authorization_url);
      
      // Open Google OAuth in a popup window
      const popup = window.open(
        authorization_url,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      // Monitor the popup for completion
      let checkClosed: NodeJS.Timeout;
      let timeout: NodeJS.Timeout;
      
      const cleanup = () => {
        if (checkClosed) clearInterval(checkClosed);
        if (timeout) clearTimeout(timeout);
        setIsLoading(false);
      };
      
      checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('🎪 Popup closed by user or completed');
          cleanup();
        }
      }, 1000);
      
      // Set a timeout for the authentication process (5 minutes)
      timeout = setTimeout(() => {
        console.log('🎪 Authentication timeout - closing popup');
        try {
          popup.close();
        } catch (e) {
          console.warn('Could not close popup:', e);
        }
        cleanup();
        toast({
          variant: "destructive",
          title: "Authentication Timeout",
          description: "Authentication took too long. Please try again.",
          duration: 5000,
        });
      }, 5 * 60 * 1000); // 5 minutes
      
    } catch (error) {
      console.error('Failed to initiate Google sign in:', error);
      
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Unable to start the sign in process. Please try again.",
        duration: 5000,
      });
      setIsLoading(false);
    }
  };

  // Email login handler
  const handleEmailLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      setIsLoading(true);
      setAuthError(''); // Clear previous errors
      await loginWithEmailPassword({ email, password });
      onOpenChange(false);
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
        duration: 3000,
      });
    } catch (error) {
      // Display error in the form instead of toast
      setAuthError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email registration handler
  const handleEmailRegister = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      setAuthError(''); // Clear previous errors
      await registerWithEmailPassword({ email, password, name });
      onOpenChange(false);
      toast({
        title: "Welcome to Talosy!",
        description: "Your account has been created successfully.",
        duration: 3000,
      });
    } catch (error) {
      // Display error in the form instead of toast
      setAuthError(error instanceof Error ? error.message : "Unable to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render different content based on auth method
  const renderContent = () => {
    switch (authMethod) {
      case 'email-login':
        return (
          <EmailLoginForm
            onBack={() => setAuthMethod('selection')}
            onSwitchToRegister={() => setAuthMethod('email-register')}
            onSubmit={handleEmailLogin}
            isLoading={isLoading}
            authError={authError}
          />
        );
      
      case 'email-register':
        return (
          <EmailRegisterForm
            onBack={() => setAuthMethod('selection')}
            onSwitchToLogin={() => setAuthMethod('email-login')}
            onSubmit={handleEmailRegister}
            isLoading={isLoading}
            authError={authError}
          />
        );
      
      default:
        return renderAuthMethodSelection();
    }
  };

  // Main auth method selection view: two buttons, nothing else. The shield
  // crest, the three trust badges and the copyright line were decoration on a
  // screen whose whole job is to hand off to Google.
  const renderAuthMethodSelection = () => (
    <div className="space-y-4 pt-2">
      {/* Radix requires a title for the dialog to be announced; it is not
          drawn, because the two buttons already say what this is. */}
      <DialogHeader className="sr-only">
        <DialogTitle>Sign in</DialogTitle>
      </DialogHeader>

      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="h-12 w-full border-border hover:bg-accent"
      >
        <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        onClick={() => setAuthMethod('email-login')}
        disabled={isLoading}
        variant="outline"
        className="h-12 w-full border-border hover:bg-accent"
      >
        <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
        Continue with Email
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

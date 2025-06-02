
import React from 'react';
import { Shield, Eye, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const handleGoogleSignIn = () => {
    // TODO: Implement Google SSO logic here
    console.log('Google Sign In clicked');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Talosy
            </DialogTitle>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full h-12 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              Use your Google account to sign in securely
            </p>
          </div>
          
          <div className="flex justify-center space-x-8 pt-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Secure OAuth</p>
              <p className="text-xs text-gray-500">2.0</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Privacy</p>
              <p className="text-xs text-gray-500">Protected</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Key className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">No Password</p>
              <p className="text-xs text-gray-500">Storage</p>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2025 Talosy. Built with FastAPI and Google OAuth.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

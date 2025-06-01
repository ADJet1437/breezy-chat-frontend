
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

const Header = () => {
  const handleSignIn = () => {
    // TODO: Implement sign-in functionality
    console.log('Sign in clicked');
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-semibold text-gray-800">Mission Control</h1>
        </div>
        <Button
          onClick={handleSignIn}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-6 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <User className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </div>
    </header>
  );
};

export default Header;

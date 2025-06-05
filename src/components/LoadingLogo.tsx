import React from 'react';
import { Shield } from 'lucide-react';

const LoadingLogo: React.FC = () => {
  return (
    <div className="relative mb-8">
      {/* Outer spinning ring */}
      <div className="w-24 h-24 mx-auto relative">
        <div className="absolute inset-0 border-4 border-transparent border-t-teal-500 border-r-cyan-500 rounded-full animate-spin"></div>
        
        {/* Inner spinning ring (counter-clockwise) */}
        <div className="absolute inset-2 border-3 border-transparent border-b-teal-400 border-l-cyan-400 rounded-full animate-spin-reverse"></div>
        
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Pulsing glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 bg-gradient-to-r from-teal-500/20 to-cyan-600/20 rounded-full animate-ping"></div>
      </div>
    </div>
  );
};

export default LoadingLogo;
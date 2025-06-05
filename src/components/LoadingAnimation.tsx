import React from 'react';

const LoadingAnimation: React.FC = () => {
  return (
    <>
      {/* Floating Elements Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-teal-300 rounded-full opacity-60 animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-cyan-300 rounded-full opacity-40 animate-float-medium"></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-300 rounded-full opacity-70 animate-float-fast"></div>
        <div className="absolute top-1/2 right-1/3 w-5 h-5 bg-teal-200 rounded-full opacity-50 animate-float-slow"></div>
      </div>

      {/* Loading Dots Animation */}
      <div className="flex space-x-2 mt-8">
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </>
  );
};

export default LoadingAnimation;

import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex justify-start group animate-fade-in">
      <div className="flex flex-col max-w-[80%] items-start">
        <div className="bg-card border border-border px-4 py-3 rounded-2xl shadow-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

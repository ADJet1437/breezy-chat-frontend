import React from 'react';

interface ImageGeneratingMessageProps {
  message: {
    id: string;
    content: string;
    prompt?: string;
    timestamp: Date;
  };
}

const ImageGeneratingMessage: React.FC<ImageGeneratingMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex justify-start group min-w-0 mb-4">
      <div className="flex flex-col max-w-[85%] min-w-0 items-start">
        {/* Image Container - Same structure as ImageMessage */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
          {/* Skeleton placeholder */}
          <div className="relative bg-muted" style={{ width: '400px', height: '400px' }}>
            {/* Shimmer animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-shimmer"></div>
            
            {/* Centered "Generating..." text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-sm font-medium">Generating...</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Image Info - Same as ImageMessage */}
        <div className="mt-2 px-2 text-xs text-gray-500 max-w-full">
          <div className="flex items-center justify-between">
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratingMessage;
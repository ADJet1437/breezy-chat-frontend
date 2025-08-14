import React from 'react';

interface ImageEditingMessageProps {
  message: {
    id: string;
    content: string;
    prompt?: string;
    timestamp: Date;
  };
}

const ImageEditingMessage: React.FC<ImageEditingMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex justify-start group min-w-0 mb-4">
      <div className="flex flex-col max-w-[85%] min-w-0 items-start">
        {/* Image Container - Same structure as ImageMessage */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
          {/* Skeleton placeholder */}
          <div className="relative bg-gradient-to-br from-orange-100 to-orange-200" style={{ width: '400px', height: '400px' }}>
            {/* Shimmer animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            
            {/* Centered "Editing..." text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-orange-600">
                <p className="text-sm font-medium">✏️ Editing...</p>
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

export default ImageEditingMessage;
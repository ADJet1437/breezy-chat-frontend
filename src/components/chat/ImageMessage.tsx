import React, { useState, useEffect } from 'react';
import { Download, Copy, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageMessageProps {
  imageUrl: string;
  imageAlt?: string;
  prompt?: string;
  filename?: string;
  timestamp: Date;
  isLoaded?: boolean;
}

const ImageMessage: React.FC<ImageMessageProps> = ({ 
  imageUrl, 
  imageAlt = 'Generated image', 
  prompt, 
  filename,
  timestamp,
  isLoaded = false
}) => {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(!isLoaded); // Initialize based on isLoaded prop

  // Update loading state when isLoaded prop changes
  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownload = async () => {
    try {
      // Convert base64 data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        description: "Image downloaded successfully",
        duration: 2000,
      });
    } catch (err) {
      toast({
        description: "Failed to download image",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const copyImageToClipboard = async () => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      toast({
        description: "Image copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      // Fallback: copy image URL
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast({
          description: "Image URL copied to clipboard",
          duration: 2000,
        });
      } catch (fallbackErr) {
        toast({
          description: "Failed to copy image",
          variant: "destructive",
          duration: 2000,
        });
      }
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    toast({
      description: "Failed to load image",
      variant: "destructive",
      duration: 3000,
    });
  };

  return (
    <>
      {/* Main Image Message */}
      <div className="flex justify-start group min-w-0 mb-4">
        <div className="flex flex-col max-w-[85%] min-w-0 items-start">
          {/* Image Container */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                <div className="text-gray-500 text-sm">Loading image...</div>
              </div>
            )}
            
            {/* Image */}
            <img 
              src={imageUrl}
              alt={imageAlt}
              className={`max-w-full h-auto block image-fade-in ${isLoaded ? 'loaded' : ''}`}
              style={{ maxHeight: '500px', maxWidth: '500px' }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Image Overlay Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyImageToClipboard}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Image Info */}
          <div className="mt-2 px-2 text-xs text-gray-500 max-w-full">
            <div className="flex items-center justify-between">
              <span>{formatTime(timestamp)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={imageUrl}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageMessage;
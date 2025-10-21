import React, { useState } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '../FileUpload';

interface FloatingChatInputProps {
  onSubmit: (message: string, fileIds: string[]) => Promise<void>;
  placeholder?: string;
}

export const FloatingChatInput: React.FC<FloatingChatInputProps> = ({
  onSubmit,
  placeholder = "Describe your project: 'Build me a todo app with React and Firebase...'"
}) => {
  const [message, setMessage] = useState('');
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [attachedFileDetails, setAttachedFileDetails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        description: "Please describe what you want to build",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(message, attachedFileIds);
    } catch (error) {
      toast({
        description: "Failed to create mission. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Always reset loading state, even if login dialog was shown
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFilesUploaded = (fileIds: string[], fileDetails: any[]) => {
    setAttachedFileIds(fileIds);
    setAttachedFileDetails(fileDetails);
    toast({
      description: `${fileIds.length} file(s) attached`,
      duration: 2000,
    });
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      {/* Glassmorphism container with gradient border */}
      <div className="relative">
        {/* Gradient border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>

        {/* Main input container */}
        <div className="relative bg-white/90 backdrop-blur-lg rounded-2xl p-2 shadow-2xl">
          {/* Attached Files Display */}
          {attachedFileIds.length > 0 && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2">
              <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                {attachedFileIds.length} file(s) attached
              </span>
              <button
                onClick={() => {
                  setAttachedFileIds([]);
                  setAttachedFileDetails([]);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm ml-auto"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-center gap-3">
            {/* File Upload Button */}
            <div className="flex-shrink-0">
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </div>

            {/* Textarea */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1 resize-none border-0 bg-transparent px-4 py-4 focus:outline-none text-gray-900 placeholder-gray-400 min-h-[56px] max-h-[200px]"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '56px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
            />

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || isLoading}
              className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

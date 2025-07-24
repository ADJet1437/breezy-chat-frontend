import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatBarProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatBar({ onSubmit, isLoading, placeholder }: ChatBarProps) {
  const [description, setDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(44); // Match missions route

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && !isLoading) {
      onSubmit(description.trim());
      setDescription('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-height adjustment for textarea - matching missions route
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height with constraints
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 44; // Minimum single line height - matching missions
      const maxHeight = 120; // Maximum height before scrolling
      
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
      
      // Enable/disable scrolling based on content
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    adjustTextareaHeight();
  };

  // Set initial textarea height on mount and auto-focus
  useEffect(() => {
    adjustTextareaHeight();
    // Auto-focus the textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Adjust height when description changes (e.g., when cleared after sending)
  useEffect(() => {
    adjustTextareaHeight();
  }, [description]);

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={description}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder=""
          className="pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl resize-none transition-all duration-200 ease-in-out min-h-[44px] max-h-[120px] overflow-y-hidden"
          style={{ height: `${textareaHeight}px` }}
          disabled={isLoading}
          rows={1}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!description.trim() || isLoading}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6"
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Creating...
          </>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
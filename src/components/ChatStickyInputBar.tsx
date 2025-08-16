import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from './FileUpload';

interface ChatStickyInputBarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFilesUploaded: (fileIds: string[], fileDetails: any[]) => void;
  attachedFileIds: string[];
  attachedFileDetails: any[];
  setAttachedFileIds: (ids: string[]) => void;
  setAttachedFileDetails: (details: any[]) => void;
  isStreaming: boolean;
  isLoadingHistory: boolean;
  missionId?: string | null;
  currentMissionId?: string | null;
  rightSidebarVisible?: boolean;
  sidebarCollapsed?: boolean;
}

export interface ChatStickyInputBarRef {
  focusInput: () => void;
}

const ChatStickyInputBar = forwardRef<ChatStickyInputBarRef, ChatStickyInputBarProps>(({
  inputValue,
  setInputValue,
  onSendMessage,
  onKeyPress,
  onFilesUploaded,
  attachedFileIds,
  attachedFileDetails,
  setAttachedFileIds,
  setAttachedFileDetails,
  isStreaming,
  isLoadingHistory,
  missionId,
  currentMissionId,
  rightSidebarVisible = false,
  sidebarCollapsed = false,
}, ref) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(44); // Initial height

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      // Reset height to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height with constraints
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 44; // Minimum single line height
      const maxHeight = 120; // Maximum height before scrolling
      
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
      
      // Enable/disable scrolling based on content
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Call original onKeyPress if it exists (handles Enter key processing)
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  useImperativeHandle(ref, () => ({
    focusInput,
  }));

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    // Adjust height when inputValue changes (e.g., when cleared after sending)
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkMobile();

    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      className={`fixed bottom-6 z-40 transition-all duration-200 ${
        !isMobile 
          ? `left-8 ${sidebarCollapsed ? 'md:left-20' : 'md:left-64'} right-6 ${rightSidebarVisible ? 'md:right-86' : ''}` 
          : 'left-4 right-4'
      }`}
      style={{ marginLeft: 'max(0px, env(safe-area-inset-left))', marginRight: 'max(0px, env(safe-area-inset-right))' }}
    >
      {/* Floating container with shadow and rounded corners */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-background/70 backdrop-blur-xl border border-border/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 p-4 space-y-3">
          {/* Attached Files Display */}
          {attachedFileIds.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-chat-attachment-bg rounded-lg border border-blue-200 dark:border-border">
              <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                {attachedFileIds.length} file(s) attached
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAttachedFileIds([]);
                  setAttachedFileDetails([]);
                }}
                className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-secondary"
              >
                Clear all
              </Button>
            </div>
          )}
          
          {/* Input Row - Integrated Design */}
          <div className="flex-1 relative bg-muted/50 rounded-2xl p-1.5 backdrop-blur-sm">
            {/* File Upload Button - Inside Input */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
              <FileUpload
                onFilesUploaded={onFilesUploaded}
                disabled={isStreaming || isLoadingHistory}
                missionId={missionId || currentMissionId}
              />
            </div>
            
            {/* Textarea with integrated buttons */}
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming || isLoadingHistory ? "AI is thinking..." : "What is your mission?"}
              className="pl-12 pr-14 border-0 bg-transparent focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none rounded-xl resize-none min-h-[44px] max-h-[120px] overflow-y-hidden text-foreground placeholder:text-muted-foreground"
              style={{ height: `${textareaHeight}px`, boxShadow: 'none !important' }}
              disabled={isStreaming || isLoadingHistory}
              rows={1}
            />
            
            {/* Send Button - Inside Input */}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <Button
                onClick={onSendMessage}
                disabled={!inputValue.trim() || isStreaming || isLoadingHistory}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-9 w-9 p-0 flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatStickyInputBar.displayName = 'ChatStickyInputBar';

export default ChatStickyInputBar;
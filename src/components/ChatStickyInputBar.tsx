import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FileUpload from './FileUpload';

interface ChatStickyInputBarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  useImperativeHandle(ref, () => ({
    focusInput,
  }));

  useEffect(() => {
    focusInput();
  }, []);

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
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-t border-gray-200 transition-all duration-200 ${
        !isMobile && rightSidebarVisible ? 'md:right-80' : ''
      }`}
      style={{ marginLeft: 'max(0px, env(safe-area-inset-left))', marginRight: 'max(0px, env(safe-area-inset-right))' }}
    >
      {/* Responsive left margin for desktop sidebar */}
      <div className={`p-6 ${!isMobile ? 'ml-0 md:ml-64' : ''}`}>
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Attached Files Display */}
          {attachedFileIds.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Paperclip className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">
                {attachedFileIds.length} file(s) attached
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAttachedFileIds([]);
                  setAttachedFileDetails([]);
                }}
                className="ml-auto text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                Clear all
              </Button>
            </div>
          )}
          
          {/* Input Row */}
          <div className="flex space-x-3">
            <FileUpload
              onFilesUploaded={onFilesUploaded}
              disabled={isStreaming || isLoadingHistory}
              missionId={missionId || currentMissionId}
            />
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Type your message here..."
                className="pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                disabled={isStreaming || isLoadingHistory}
              />
            </div>
            <Button
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isStreaming || isLoadingHistory}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatStickyInputBar.displayName = 'ChatStickyInputBar';

export default ChatStickyInputBar;
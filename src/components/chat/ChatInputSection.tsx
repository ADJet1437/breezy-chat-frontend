import React from 'react';
import { Send } from 'lucide-react';
import FileUpload from '../FileUpload';
import { AttachedFiles } from './AttachedFiles';

interface ChatInputSectionProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFilesUploaded: (fileIds: string[], fileDetails: any[]) => void;
  attachedFileIds: string[];
  attachedFileDetails: any[];
  setAttachedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAttachedFileDetails: React.Dispatch<React.SetStateAction<any[]>>;
  isStreaming: boolean;
  isLoadingHistory: boolean;
}

export const ChatInputSection: React.FC<ChatInputSectionProps> = ({
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
  isLoadingHistory
}) => {
  return (
    <div className="space-y-3">
      <AttachedFiles
        files={attachedFileDetails}
        onRemove={id => {
          setAttachedFileIds(ids => ids.filter(i => i !== id));
          setAttachedFileDetails(files => files.filter(f => f.id !== id));
        }}
      />

      {/* Input Area */}
      <div className="flex items-center space-x-3">
        {/* File Upload Button */}
        <div className="flex-shrink-0">
          <FileUpload onFilesUploaded={onFilesUploaded} />
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={isStreaming || isLoadingHistory ? "AI is thinking..." : "Type your message..."}
            disabled={isStreaming || isLoadingHistory}
            className="w-full resize-none border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground min-h-[44px] max-h-[120px]"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onSendMessage}
            disabled={!inputValue.trim() || isStreaming || isLoadingHistory}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center justify-center h-[44px]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

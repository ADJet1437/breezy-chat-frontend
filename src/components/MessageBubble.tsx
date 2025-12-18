
import React from 'react';
import { Copy, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { toast } = useToast();
  const isBot = message.sender === 'bot';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        description: "Message copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      toast({
        description: "Failed to copy message",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('text/')) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word')) return '📘';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} group min-w-0`}>
      <div className={`flex flex-col max-w-[85%] min-w-0 ${isBot ? 'items-start' : 'items-end'}`}>
        {isBot ? (
          /* Assistant message - frameless */
          <>
            <div className="prose prose-sm max-w-full dark:prose-invert">
              <MarkdownRenderer
                content={message.content}
              />
              {/* Display image for bot messages if present (legacy support) */}
              {message.imageUrl && (
                <div className="mt-3">
                  <img
                    src={message.imageUrl}
                    alt={message.imageAlt || 'Generated image'}
                    className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              )}
              {/* Display attached files for bot messages (non-image files only) */}
              {message.attachedFiles && message.attachedFiles.length > 0 && (
                <div className="mt-3">
                  {message.attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted rounded-lg p-2 mb-2">
                      <span className="text-sm">{getFileIcon(file.type)}</span>
                      <span className="flex-1 truncate font-medium">{file.name}</span>
                      <span className="text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`flex items-center mt-1 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
              <span className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </>
        ) : (
          /* User message - keep frame */
          <>
            <div
              className="px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md min-w-0 max-w-full bg-white/70 border border-blue-300/60 text-slate-800 shadow-sm backdrop-blur-sm dark:bg-secondary dark:border-secondary dark:text-secondary-foreground"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              {/* Display attached files for user messages */}
              {message.attachedFiles && message.attachedFiles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Paperclip className="h-3 w-3 text-white/70" />
                    <span className="text-xs text-white/70 font-medium">
                      {message.attachedFiles.length} file(s) attached
                    </span>
                  </div>
                  <div className="space-y-1">
                    {message.attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs text-white/90 bg-white/10 rounded-lg p-2">
                        <span className="text-sm">{getFileIcon(file.type)}</span>
                        <span className="flex-1 truncate font-medium">{file.name}</span>
                        <span className="text-white/60">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`flex items-center mt-1 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
              <span className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

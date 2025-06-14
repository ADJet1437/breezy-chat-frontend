
import React from 'react';
import { Bot, User, Copy, Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} group`}>
      <div className={`flex max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'} items-start space-x-3`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={isBot ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gradient-to-r from-green-500 to-blue-500 text-white'}>
            {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
              isBot
                ? 'bg-white border border-gray-200 text-gray-800'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            }`}
          >
            {isBot ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { children, className } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-2">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto">
                        <table className="border-collapse border border-gray-300 text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-2 py-1">{children}</td>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div>
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
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

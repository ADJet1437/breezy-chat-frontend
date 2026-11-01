
import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { AttachedFiles } from './chat/AttachedFiles';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

// How long the tick stays before the icon goes back to the clipboard.
const COPIED_FOR_MS = 1600;

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { toast } = useToast();
  const isBot = message.sender === 'bot';
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // The button answers for itself. A toast for this reports success
      // somewhere other than where the action happened, and covers part of
      // the conversation to do it.
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_FOR_MS);
    } catch (err) {
      // A failure still needs saying: nothing on the button can express it,
      // and silence would read as success.
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
              {message.attachedFiles && (
                <div className="mt-2">
                  <AttachedFiles files={message.attachedFiles} />
                </div>
              )}
            </div>

            <div className={`flex items-center mt-1 space-x-2 transition-opacity duration-200 ${
              copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <span className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                aria-label={copied ? 'Copied' : 'Copy message'}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </>
        ) : (
          /* User message - keep frame */
          <>
            {/* Above the bubble, not inside it. A file and a sentence are
                two things the person sent, and a chip reads better beside
                the message than as a footnote within it. The old block was
                also text-white/70 on a bg-white/70 bubble, so in light mode
                the filename was invisible. */}
            {message.attachedFiles && (
              <AttachedFiles files={message.attachedFiles} align="end" />
            )}
            <div
              className="px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md min-w-0 max-w-full bg-white/70 border border-blue-300/60 text-slate-800 shadow-sm backdrop-blur-sm dark:bg-secondary dark:border-secondary dark:text-secondary-foreground"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>

            <div className={`flex items-center mt-1 space-x-2 transition-opacity duration-200 ${
              copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <span className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                aria-label={copied ? 'Copied' : 'Copy message'}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

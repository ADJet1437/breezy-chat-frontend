import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ConversationMessageProps {
  message: Message;
}

export function ConversationMessage({ message }: ConversationMessageProps) {
  const { toast } = useToast();
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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


  const getMessageStyles = () => {
    switch (message.type) {
      case 'user':
        return {
          container: 'flex justify-end group',
          messageContainer: 'flex flex-col max-w-[80%] items-end',
          card: 'bg-card',
        };
      case 'assistant':
        return {
          container: 'flex justify-start group',
          messageContainer: 'flex flex-col max-w-[80%] items-start',
          card: 'bg-card',
        };
      case 'system':
        return {
          container: 'flex justify-center group',
          messageContainer: 'flex flex-col max-w-[80%] items-start',
          card: 'bg-muted',
        };
      default:
        return {
          container: 'flex justify-start group',
          messageContainer: 'flex flex-col max-w-[80%] items-start',
          card: 'bg-card',
        };
    }
  };

  const styles = getMessageStyles();

  return (
    <div className={`${styles.container}`}>
      <div className={`${styles.messageContainer}`}>
        <Card className={`${styles.card} shadow-sm`}>
          <CardContent className="p-3">
            {message.type === 'assistant' ? (
              <MarkdownRenderer 
                content={message.content}
                className="text-sm"
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Timestamp and Copy Button */}
        <div className="flex items-center mt-1 space-x-2 px-1">
          <div className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
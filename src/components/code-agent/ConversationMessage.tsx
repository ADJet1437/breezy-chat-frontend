import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  const getMessageStyles = () => {
    switch (message.type) {
      case 'user':
        return {
          container: 'ml-12',
          card: 'bg-card',
        };
      case 'assistant':
        return {
          container: 'mr-12',
          card: 'bg-card',
        };
      case 'system':
        return {
          container: 'mx-12',
          card: 'bg-muted',
        };
      default:
        return {
          container: '',
          card: 'bg-card',
        };
    }
  };

  const styles = getMessageStyles();

  return (
    <div className={`${styles.container}`}>
      {/* Message Content */}
      <div className="w-full">
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
        
        {/* Timestamp */}
        <div className="text-xs text-muted-foreground mt-1 px-1">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
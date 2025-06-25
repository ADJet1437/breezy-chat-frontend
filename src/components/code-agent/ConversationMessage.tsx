import React from 'react';
import { Bot, User, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

  const getMessageIcon = () => {
    switch (message.type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getMessageStyles = () => {
    switch (message.type) {
      case 'user':
        return {
          container: 'ml-12',
          card: 'bg-primary text-primary-foreground',
          icon: 'bg-primary text-primary-foreground',
        };
      case 'assistant':
        return {
          container: 'mr-12',
          card: 'bg-card',
          icon: 'bg-blue-500 text-white',
        };
      case 'system':
        return {
          container: 'mx-12',
          card: 'bg-muted',
          icon: 'bg-gray-500 text-white',
        };
      default:
        return {
          container: '',
          card: 'bg-card',
          icon: 'bg-gray-500 text-white',
        };
    }
  };

  const styles = getMessageStyles();

  return (
    <div className={`flex gap-3 ${styles.container}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${styles.icon}`}>
        {getMessageIcon()}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <Card className={`${styles.card} shadow-sm`}>
          <CardContent className="p-3">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
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
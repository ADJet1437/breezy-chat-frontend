
import React from 'react';
import MessageBubble from './MessageBubble';
import ImageMessage from './chat/ImageMessage';
import { ToolUseMessage } from './chat/ToolUseMessage';
import { ThinkingMessage } from './chat/ThinkingMessage';
import ImageGeneratingMessage from './chat/ImageGeneratingMessage';
import ImageEditingMessage from './chat/ImageEditingMessage';
import { Message } from '../types/chat';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-4 min-w-0">
      {messages.map((message) => {
        if (message.type === 'thinking') {
          return (
            <ThinkingMessage
              key={message.id}
              content={message.content}
              streaming={message.thinkingStreaming}
            />
          );
        }

        if (message.type === 'tool-use') {
          return (
            <ToolUseMessage
              key={message.id}
              toolName={message.toolName || 'tool'}
              summary={message.toolSummary}
              failed={message.toolFailed}
              running={message.toolRunning}
              progress={message.toolProgress}
            />
          );
        }

        if (message.type === 'image-generating') {
          return (
            <ImageGeneratingMessage
              key={message.id}
              message={message}
            />
          );
        }
        if (message.type === 'image-editing') {
          return (
            <ImageEditingMessage
              key={message.id}
              message={message}
            />
          );
        }
        if (message.type === 'image') {
          return (
            <ImageMessage
              key={message.id}
              imageUrl={message.imageUrl!}
              imageAlt={message.imageAlt}
              prompt={message.prompt}
              filename={message.filename}
              timestamp={message.timestamp}
              isLoaded={message.isLoaded}
            />
          );
        }
        return <MessageBubble key={message.id} message={message} />;
      })}
    </div>
  );
};

export default MessageList;

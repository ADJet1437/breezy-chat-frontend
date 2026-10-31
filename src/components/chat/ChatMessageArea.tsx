import React, { useRef, useEffect } from 'react';
import MessageList from '../MessageList';
import TypingIndicator from '../TypingIndicator';
import MissionProgressIndicator, { MissionPhase } from '../MissionProgressIndicator';
import { Message } from '../../types/chat';

interface ChatMessageAreaProps {
  messages: Message[];
  isLoadingHistory: boolean;
  isStreaming: boolean;
  missionPhase: MissionPhase;
  currentStep: string;
  executionProgress: number;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  messages,
  isLoadingHistory,
  isStreaming,
  missionPhase,
  currentStep,
  executionProgress
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <MessageList messages={messages} />
      {/* Nothing to report once the phase is complete: the answer is
          already on screen, and a bubble reading "Thinking · Done" after
          every round is a receipt for work the user just watched. */}
      {isStreaming && missionPhase !== 'init' && missionPhase !== 'complete' ? (
        <MissionProgressIndicator
          phase={missionPhase}
          currentStep={currentStep}
          progress={executionProgress}
        />
      ) : isStreaming ? (
        <TypingIndicator />
      ) : null}
      <div ref={messagesEndRef} />
    </div>
  );
};

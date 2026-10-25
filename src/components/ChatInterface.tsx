import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import { useMissionData, MissionDetails } from '../hooks/useMissionData';
import { useMessageStreaming } from '../hooks/useMessageStreaming';
import { ChatView } from './chat/ChatView';
import { ChatStickyInputBarRef } from './ChatStickyInputBar';
import { AttachedFile, Message } from '../types/chat';

interface ChatInterfaceProps {
  missionId?: string;
  missionData?: MissionDetails | null;
  isParentLoading?: boolean;
  initialMessage?: string;
  initialFileIds?: string[];
}

const ChatInterface = ({
  missionId,
  missionData,
  isParentLoading = false,
  initialMessage,
  initialFileIds = []
}: ChatInterfaceProps) => {
  // Context
  const { currentMissionId, setCurrentMissionId, setMissionData } = useMissionContext();
  const { toast } = useToast();

  // UI State
  const [inputValue, setInputValue] = useState('');
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [attachedFileDetails, setAttachedFileDetails] = useState<AttachedFile[]>([]);

  // Refs
  const inputBarRef = useRef<ChatStickyInputBarRef>(null);

  // Custom Hooks
  const missionHook = useMissionData(
    missionId,
    currentMissionId,
    missionData,
    isParentLoading,
    setMissionData
  );

  const streamingHook = useMessageStreaming({
    missionId,
    messages: missionHook.messages,
    setMessages: missionHook.setMessages,
    setCurrentMissionId,
    attachedFileIds,
    setAttachedFileIds,
    setAttachedFileDetails,
    inputBarRef
  });

  // Auto-send initial message when creating new mission from HomePage
  useEffect(() => {
    // Only auto-send when we have initialMessage and no missionId (creating new mission)
    if (initialMessage && !missionId) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: initialMessage,
        sender: 'user',
        timestamp: new Date(),
      };

      missionHook.setMessages(prev => [...prev, userMessage]);
      streamingHook.sendMessageToBackend(initialMessage, initialFileIds);
    }
    // Only run once on mount when initialMessage is provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      attachedFiles: attachedFileDetails.length > 0
        ? attachedFileDetails.map(({ id, name, size, type }) => ({ id, name, size, type }))
        : undefined,
    };

    missionHook.setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');

    inputBarRef.current?.focusInput();
    await streamingHook.sendMessageToBackend(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFilesUploaded = (fileIds: string[], fileDetails: AttachedFile[]) => {
    setAttachedFileIds(fileIds);
    setAttachedFileDetails(fileDetails);
    toast({
      description: `${fileIds.length} file(s) attached to your message`,
      duration: 3000,
    });
  };

  const handleSubscriptionSuccess = async () => {
    streamingHook.setShowSubscriptionDialog(false);

    toast({
      description: "Subscription successful! You can now continue chatting.",
      duration: 3000,
    });

    if (streamingHook.pendingMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: streamingHook.pendingMessage,
        sender: 'user',
        timestamp: new Date(),
        attachedFiles: undefined,
      };
      missionHook.setMessages(prev => [...prev, userMessage]);

      const messageToRetry = streamingHook.pendingMessage;
      streamingHook.setPendingMessage(null);

      await streamingHook.sendMessageToBackend(messageToRetry);
    }

    inputBarRef.current?.focusInput();
  };

  const handleSubscriptionCancel = () => {
    streamingHook.setShowSubscriptionDialog(false);
    streamingHook.setPendingMessage(null);
  };

  return (
    <ChatView
      messages={missionHook.messages}
      isLoadingHistory={missionHook.isLoadingHistory}
      isStreaming={streamingHook.isStreaming}
      missionPhase={streamingHook.missionPhase}
      currentStep={streamingHook.currentStep}
      executionProgress={streamingHook.executionProgress}
      inputValue={inputValue}
      setInputValue={setInputValue}
      onSendMessage={handleSendMessage}
      onKeyPress={handleKeyPress}
      onFilesUploaded={handleFilesUploaded}
      attachedFileIds={attachedFileIds}
      attachedFileDetails={attachedFileDetails}
      setAttachedFileIds={setAttachedFileIds}
      setAttachedFileDetails={setAttachedFileDetails}
      deckId={streamingHook.deckId}
      deckRevision={streamingHook.deckRevision}
      expectedSlides={streamingHook.expectedSlides}
      showSubscriptionDialog={streamingHook.showSubscriptionDialog}
      onSubscriptionDialogChange={(open) => {
        if (!open) handleSubscriptionCancel();
      }}
      onSubscribed={handleSubscriptionSuccess}
      subscriptionMessage={streamingHook.subscriptionMessage}
    />
  );
};

export default ChatInterface;

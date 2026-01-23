import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
import { useMissionData } from '../hooks/useMissionData';
import { useMessageStreaming } from '../hooks/useMessageStreaming';
import { useProjectActions } from '../hooks/useProjectActions';
import { SplitLayoutView } from './chat/SplitLayoutView';
import { ChatStickyInputBarRef } from './ChatStickyInputBar';
import { Message } from '../types/chat';

type ViewMode = 'build' | 'files' | 'presentation';

interface ChatInterfaceProps {
  missionId?: string;
  rightSidebarVisible?: boolean;
  missionData?: any; // MissionDetails type from useMissionData hook
  isParentLoading?: boolean;
  initialMessage?: string;
  initialFileIds?: string[];
}

const ChatInterface = ({
  missionId,
  rightSidebarVisible = false,
  missionData,
  isParentLoading = false,
  initialMessage,
  initialFileIds = []
}: ChatInterfaceProps) => {
  // Context
  const { currentMissionId, setCurrentMissionId, setMissionData } = useMissionContext();
  const { accessToken } = useAuth();
  const { toast } = useToast();

  // UI State
  const [inputValue, setInputValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [attachedFileDetails, setAttachedFileDetails] = useState<any[]>([]);
  // Sidebar is always visible in chat view
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('build');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Refs
  const inputBarRef = useRef<ChatStickyInputBarRef>(null);

  // Custom Hooks
  const missionHook = useMissionData(
    missionId,
    currentMissionId,
    missionData,
    isParentLoading,
    setMissionData,
    setViewMode,
    setShowRightPanel
  );

  const streamingHook = useMessageStreaming({
    missionId,
    currentMissionId,
    messages: missionHook.messages,
    setMessages: missionHook.setMessages,
    setCurrentMissionId,
    projectData: missionHook.projectData,
    setProjectData: missionHook.setProjectData,
    projectDataRef: missionHook.projectDataRef,
    showRightPanel,
    setShowRightPanel,
    setViewMode,
    setPresentationHtml: missionHook.setPresentationHtml,
    setPresentations: missionHook.setPresentations,
    setSelectedPresentationId: missionHook.setSelectedPresentationId,
    setRefreshTrigger,
    setIsProjectReady: missionHook.setIsProjectReady,
    attachedFileIds,
    setAttachedFileIds,
    setAttachedFileDetails,
    inputBarRef
  });

  const projectActions = useProjectActions({
    projectData: missionHook.projectData,
    setProjectData: missionHook.setProjectData,
    projectDataRef: missionHook.projectDataRef,
    setShowRightPanel,
    setMessages: missionHook.setMessages,
    missionId,
    currentMissionId,
    presentationHtml: missionHook.presentationHtml,
    accessToken
  });

  // Effects
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        const newState = JSON.parse(saved);
        if (newState !== sidebarCollapsed) {
          setSidebarCollapsed(newState);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [sidebarCollapsed]);

  // Sidebar is always visible, no need to persist or toggle

  // Auto-send initial message when creating new mission from HomePage
  useEffect(() => {
    // Only auto-send when we have initialMessage and no missionId (creating new mission)
    if (initialMessage && !missionId) {
      // Create user message for display
      const userMessage: Message = {
        id: Date.now().toString(),
        content: initialMessage,
        sender: 'user',
        timestamp: new Date(),
      };

      missionHook.setMessages(prev => [...prev, userMessage]);

      // Send to backend with file IDs
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
      attachedFiles: attachedFileDetails.length > 0 ? attachedFileDetails.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type
      })) : undefined,
    };

    missionHook.setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    missionHook.setPresentationHtml('');
    missionHook.setSelectedPresentationId(null);
    streamingHook.setIsPresentationStreaming(false);

    inputBarRef.current?.focusInput();
    await streamingHook.sendMessageToBackend(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFilesUploaded = (fileIds: string[], fileDetails: any[]) => {
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

  // Always show split view in chat interface
  return (
    <SplitLayoutView
      messages={missionHook.messages}
      isLoadingHistory={missionHook.isLoadingHistory}
      isStreaming={streamingHook.isStreaming}
      missionPhase={streamingHook.missionPhase}
      projectData={missionHook.projectData}
      isProjectReady={missionHook.isProjectReady}
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
      viewMode={viewMode}
      setViewMode={setViewMode}
      presentations={missionHook.presentations}
      selectedPresentationId={missionHook.selectedPresentationId}
      setSelectedPresentationId={missionHook.setSelectedPresentationId}
      presentationHtml={missionHook.presentationHtml}
      setPresentationHtml={missionHook.setPresentationHtml}
      refreshTrigger={refreshTrigger}
      isLoadingPreview={projectActions.isLoadingPreview}
      onView={projectActions.handleView}
      onCloseRightPanel={() => {
        // Panel is always visible, but we can handle presentation streaming state
        streamingHook.setIsPresentationStreaming(false);
      }}
      onExportPDF={projectActions.handleExportPDF}
      onDownloadProject={projectActions.handleDownloadProject}
      onDeleteProject={projectActions.handleDeleteProject}
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

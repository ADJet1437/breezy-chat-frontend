import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
import { useMissionData } from '../hooks/useMissionData';
import { useMessageStreaming } from '../hooks/useMessageStreaming';
import { useProjectActions } from '../hooks/useProjectActions';
import { SplitLayoutView } from './chat/SplitLayoutView';
import { FullWidthChatView } from './chat/FullWidthChatView';
import { ChatStickyInputBarRef } from './ChatStickyInputBar';
import { Message } from '../types/chat';

type ViewMode = 'build' | 'files' | 'presentation';

interface TaskMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  mission_id: string;
  file_ids: string[];
  files?: {
    id: string;
    name: string;
    size: number;
    type: string;
    source: string;
  }[];
  images?: {
    id: string;
    name: string;
    size: number;
    type: string;
    source: string;
  }[];
}

interface MissionDetails {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  llm_id: string;
  system_prompt?: string;
  task_messages: TaskMessage[];
  code_agent: {
    id: string | null;
  };
}

interface ChatInterfaceProps {
  missionId?: string;
  rightSidebarVisible?: boolean;
  missionData?: MissionDetails | null;
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
  const [showRightPanel, setShowRightPanel] = useState(() => {
    const saved = localStorage.getItem('missionCodeViewOpen');
    return saved ? JSON.parse(saved) : false;
  });
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

  useEffect(() => {
    localStorage.setItem('missionCodeViewOpen', JSON.stringify(showRightPanel));
  }, [showRightPanel]);

  useEffect(() => {
    const handleToggleCodeView = () => {
      setShowRightPanel(prev => !prev);
    };

    const chatElement = document.querySelector('[data-chat-interface]');
    if (chatElement) {
      chatElement.addEventListener('toggleCodeView', handleToggleCodeView);
      return () => {
        chatElement.removeEventListener('toggleCodeView', handleToggleCodeView);
      };
    }
  }, [missionHook.projectData]);

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

  // Render appropriate layout
  const shouldShowSplitView = showRightPanel && (
    missionHook.projectData?.project_id ||
    missionHook.presentations.length > 0 ||
    streamingHook.isPresentationStreaming
  );

  if (shouldShowSplitView) {
    return (
      <SplitLayoutView
        messages={missionHook.messages}
        isLoadingHistory={missionHook.isLoadingHistory}
        isStreaming={streamingHook.isStreaming}
        missionPhase={streamingHook.missionPhase}
        projectData={missionHook.projectData}
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
          setShowRightPanel(false);
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
  }

  return (
    <FullWidthChatView
      messages={missionHook.messages}
      isLoadingHistory={missionHook.isLoadingHistory}
      isStreaming={streamingHook.isStreaming}
      missionPhase={streamingHook.missionPhase}
      projectData={missionHook.projectData}
      currentStep={streamingHook.currentStep}
      executionProgress={streamingHook.executionProgress}
      inputBarRef={inputBarRef}
      inputValue={inputValue}
      setInputValue={setInputValue}
      onSendMessage={handleSendMessage}
      onKeyPress={handleKeyPress}
      onFilesUploaded={handleFilesUploaded}
      attachedFileIds={attachedFileIds}
      attachedFileDetails={attachedFileDetails}
      setAttachedFileIds={setAttachedFileIds}
      setAttachedFileDetails={setAttachedFileDetails}
      missionId={missionId}
      currentMissionId={currentMissionId}
      rightSidebarVisible={rightSidebarVisible}
      sidebarCollapsed={sidebarCollapsed}
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

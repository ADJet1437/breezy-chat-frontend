import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageArea } from './ChatMessageArea';
import ChatStickyInputBar, { ChatStickyInputBarRef } from '../ChatStickyInputBar';
import SubscriptionDialog from '../SubscriptionDialog';
import { Message } from '../../types/chat';
import { MissionPhase } from '../MissionProgressIndicator';

interface ProjectData {
  project_id: string;
  project_name: string;
  project_path: string;
  session_id: string;
}

interface FullWidthChatViewProps {
  // Message area props
  messages: Message[];
  isLoadingHistory: boolean;
  isStreaming: boolean;
  missionPhase: MissionPhase;
  projectData: ProjectData | null;
  currentStep: string;
  executionProgress: number;

  // Input bar props
  inputBarRef: React.RefObject<ChatStickyInputBarRef>;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFilesUploaded: (fileIds: string[], fileDetails: any[]) => void;
  attachedFileIds: string[];
  attachedFileDetails: any[];
  setAttachedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAttachedFileDetails: React.Dispatch<React.SetStateAction<any[]>>;
  missionId?: string;
  currentMissionId: string | null;
  rightSidebarVisible: boolean;
  sidebarCollapsed: boolean;

  // Subscription dialog
  showSubscriptionDialog: boolean;
  onSubscriptionDialogChange: (open: boolean) => void;
  onSubscribed: () => void;
  subscriptionMessage: string;
}

export const FullWidthChatView: React.FC<FullWidthChatViewProps> = ({
  messages,
  isLoadingHistory,
  isStreaming,
  missionPhase,
  projectData,
  currentStep,
  executionProgress,
  inputBarRef,
  inputValue,
  setInputValue,
  onSendMessage,
  onKeyPress,
  onFilesUploaded,
  attachedFileIds,
  attachedFileDetails,
  setAttachedFileIds,
  setAttachedFileDetails,
  missionId,
  currentMissionId,
  rightSidebarVisible,
  sidebarCollapsed,
  showSubscriptionDialog,
  onSubscriptionDialogChange,
  onSubscribed,
  subscriptionMessage
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-background dark:to-background" data-chat-interface>
      {/* Messages Area with bottom padding for floating input */}
      <div className="flex flex-col h-full pb-24">
        <div className="flex-1 min-h-0 p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <ScrollArea className="flex-1">
              <ChatMessageArea
                messages={messages}
                isLoadingHistory={isLoadingHistory}
                isStreaming={isStreaming}
                missionPhase={missionPhase}
                projectName={projectData?.project_name}
                currentStep={currentStep}
                executionProgress={executionProgress}
              />
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Sticky Input Bar */}
      <ChatStickyInputBar
        ref={inputBarRef}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSendMessage={onSendMessage}
        onKeyPress={onKeyPress}
        onFilesUploaded={onFilesUploaded}
        attachedFileIds={attachedFileIds}
        attachedFileDetails={attachedFileDetails}
        setAttachedFileIds={setAttachedFileIds}
        setAttachedFileDetails={setAttachedFileDetails}
        isStreaming={isStreaming}
        isLoadingHistory={isLoadingHistory}
        missionId={missionId}
        currentMissionId={currentMissionId}
        rightSidebarVisible={rightSidebarVisible}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Subscription Dialog */}
      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={onSubscriptionDialogChange}
        onSubscribed={onSubscribed}
        message={subscriptionMessage}
      />
    </div>
  );
};

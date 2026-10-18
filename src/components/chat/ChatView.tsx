import React from 'react';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatInputSection } from './ChatInputSection';
import { AttachedFile, Message } from '../../types/chat';
import { MissionPhase } from '../MissionProgressIndicator';
import SubscriptionDialog from '../SubscriptionDialog';

interface ChatViewProps {
  // Message area props
  messages: Message[];
  isLoadingHistory: boolean;
  isStreaming: boolean;
  missionPhase: MissionPhase;
  currentStep: string;
  executionProgress: number;

  // Input section props
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFilesUploaded: (fileIds: string[], fileDetails: AttachedFile[]) => void;
  attachedFileIds: string[];
  attachedFileDetails: AttachedFile[];
  setAttachedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAttachedFileDetails: React.Dispatch<React.SetStateAction<AttachedFile[]>>;

  // Subscription dialog
  showSubscriptionDialog: boolean;
  onSubscriptionDialogChange: (open: boolean) => void;
  onSubscribed: () => void;
  subscriptionMessage: string;
}

/**
 * The conversation, full width.
 *
 * This replaced SplitLayoutView, which reserved 65% of the window for a code
 * project preview. There is no artifact panel any more: a chat is the whole
 * surface, so the message column owns the window and is centred rather than
 * stretched -- long lines are hard to read edge to edge on a wide screen.
 */
export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoadingHistory,
  isStreaming,
  missionPhase,
  currentStep,
  executionProgress,
  inputValue,
  setInputValue,
  onSendMessage,
  onKeyPress,
  onFilesUploaded,
  attachedFileIds,
  attachedFileDetails,
  setAttachedFileIds,
  setAttachedFileDetails,
  showSubscriptionDialog,
  onSubscriptionDialogChange,
  onSubscribed,
  subscriptionMessage,
}) => {
  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden bg-background"
      data-chat-interface
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
        <div className="mx-auto w-full max-w-3xl p-4">
          <ChatMessageArea
            messages={messages}
            isLoadingHistory={isLoadingHistory}
            isStreaming={isStreaming}
            missionPhase={missionPhase}
            currentStep={currentStep}
            executionProgress={executionProgress}
          />
        </div>
      </div>

      <div className="flex-shrink-0 border-t bg-background">
        <div className="mx-auto w-full max-w-3xl p-4">
          <ChatInputSection
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
          />
        </div>
      </div>

      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={onSubscriptionDialogChange}
        onSubscribed={onSubscribed}
        message={subscriptionMessage}
      />
    </div>
  );
};

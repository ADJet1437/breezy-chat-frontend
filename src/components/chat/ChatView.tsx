import React from 'react';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatInputSection } from './ChatInputSection';
import { AttachedFile, Message } from '../../types/chat';
import { MissionPhase } from '../MissionProgressIndicator';
import SubscriptionDialog from '../SubscriptionDialog';
import { DeckPanel } from '../deck/DeckPanel';

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

  // Artifact panel. A deck opens it; nothing else does yet. When another
  // artifact type arrives this becomes a {kind, component} lookup rather than
  // another branch -- a viewMode union is what made the old panel assume
  // everything was a code project.
  deckId?: string | null;
  deckRevision?: number;
  expectedSlides?: number;

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
  deckId,
  deckRevision = 0,
  expectedSlides = 0,
  showSubscriptionDialog,
  onSubscriptionDialogChange,
  onSubscribed,
  subscriptionMessage,
}) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background" data-chat-interface>
      <div
        className={`flex min-w-0 flex-col ${deckId ? 'w-[42%] border-r' : 'w-full'}`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
          <div className={`mx-auto w-full p-4 ${deckId ? '' : 'max-w-3xl'}`}>
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
          <div className={`mx-auto w-full p-4 ${deckId ? '' : 'max-w-3xl'}`}>
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
      </div>

      {deckId && (
        <div className="min-w-0 flex-1">
          <DeckPanel
            deckId={deckId}
            revisionSignal={deckRevision}
            expectedSlides={expectedSlides}
          />
        </div>
      )}

      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={onSubscriptionDialogChange}
        onSubscribed={onSubscribed}
        message={subscriptionMessage}
      />
    </div>
  );
};

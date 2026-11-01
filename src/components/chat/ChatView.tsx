import React, { useEffect, useRef, useState } from 'react';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatInputSection } from './ChatInputSection';
import { CreditWarning } from './CreditWarning';
import { AttachedFile, Message } from '../../types/chat';
import { MissionPhase } from '../MissionProgressIndicator';
import { CreditStatus } from '../../hooks/useMessageStreaming';
import SubscriptionDialog from '../SubscriptionDialog';
import { DeckPanel } from '../deck/DeckPanel';
import { AppPanel } from '../app/AppPanel';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { useIsMobile } from '@/hooks/use-mobile';

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
  creditStatus?: CreditStatus | null;

  // Artifact panel. A deck opens it; nothing else does yet. When another
  // artifact type arrives this becomes a {kind, component} lookup rather than
  // another branch -- a viewMode union is what made the old panel assume
  // everything was a code project.
  deckId?: string | null;
  missionId?: string | null;
  appId?: string | null;
  appSlug?: string | null;
  appRevision?: number;
  appProgress?: string | null;
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
  creditStatus,
  deckId,
  missionId,
  appId,
  appSlug,
  appRevision = 0,
  appProgress,
  deckRevision = 0,
  expectedSlides = 0,
  showSubscriptionDialog,
  onSubscriptionDialogChange,
  onSubscribed,
  subscriptionMessage,
}) => {
  const isMobile = useIsMobile();
  // Which of the two a phone is showing. There is no room to split: at
  // 390px the 35% floor leaves 136px of conversation and 253px of artifact,
  // and neither is usable. One at a time, with a switch.
  const [mobileView, setMobileView] = useState<'chat' | 'artifact'>('chat');

  const deckPanelRef = useRef<ImperativePanelHandle>(null);

  // Double-click the handle to put the split back. A persisted width with no
  // way to undo it is the sidebar bug again, in a different shape.
  const resetSplit = () => deckPanelRef.current?.resize(58);

  const conversation = (
      <div className="flex h-full min-w-0 flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
          <div className={`mx-auto w-full p-4 ${deckId || appId ? '' : 'max-w-3xl'}`}>
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

        <div className="flex-shrink-0 bg-background">
          <div className={`mx-auto w-full p-4 ${deckId || appId ? '' : 'max-w-3xl'}`}>
            {creditStatus?.warn && (
              <div className="mb-3">
                <CreditWarning status={creditStatus} />
              </div>
            )}
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
  );

  // A conversation shows one artifact: the deck if it has one, otherwise the
  // app. The app panel opens on design_app, long before anything is built,
  // so the schema is visible while the pages are being written.
  const artifact = deckId ? 'deck' : appId ? 'app' : null;

  // An artifact appearing mid-conversation is the interesting moment, and on
  // a phone it happens on a screen the user is not looking at. Switch to it
  // once, when it first exists; they can switch back.
  useEffect(() => {
    if (artifact) setMobileView('artifact');
  }, [artifact]);

  const artifactPane = (
    <div className="h-full min-w-0">
      {artifact === 'deck' ? (
        <DeckPanel
          deckId={deckId}
          revisionSignal={deckRevision}
          expectedSlides={expectedSlides}
        />
      ) : (
        <AppPanel
          missionId={missionId ?? null}
          slug={appSlug ?? null}
          revisionSignal={appRevision}
          progress={appProgress}
        />
      )}
    </div>
  );

  // Phones get one pane and a switch rather than a split. The panes stay
  // mounted -- unmounting the conversation loses its scroll position, and
  // unmounting the app panel reloads the iframe, which rebuilds the app.
  if (artifact && isMobile) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-background" data-chat-interface>
        <div className="flex shrink-0 gap-1 border-b bg-background p-1.5">
          {([['chat', 'Chat'], ['artifact', artifact === 'deck' ? 'Slides' : 'App']] as const).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMobileView(key)}
                aria-pressed={mobileView === key}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  mobileView === key
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
        <div className={`min-h-0 flex-1 ${mobileView === 'chat' ? '' : 'hidden'}`}>
          {conversation}
        </div>
        <div className={`min-h-0 flex-1 ${mobileView === 'artifact' ? '' : 'hidden'}`}>
          {artifactPane}
        </div>
        <SubscriptionDialog
          open={showSubscriptionDialog}
          onOpenChange={onSubscriptionDialogChange}
          onSubscribed={onSubscribed}
          message={subscriptionMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background" data-chat-interface>
      {artifact ? (
        // Draggable split. autoSaveId persists the width per browser, and the
        // bounds keep both sides usable: under ~30% the composer and the slide
        // picker both start clipping, and a pane dragged to nothing is a pane
        // with no obvious way back.
        <ResizablePanelGroup
          direction="horizontal"
          // Renamed deliberately: the old key has a saved split pinned at
          // the 30% minimum in browsers that have it, and a stored value
          // inside the bounds is never corrected. A new key starts
          // everyone at the default again.
          autoSaveId="chat-split-v2"
          className="flex-1"
        >
          {/* 35% of a 1400px window leaves ~420px for the conversation,
              which is the narrowest it stays readable at. 30 was reachable
              by dragging and left it unusable. */}
          <ResizablePanel defaultSize={42} minSize={35} maxSize={65} className="min-w-0">
            {conversation}
          </ResizablePanel>

          <ResizableHandle withHandle onDoubleClick={resetSplit} />

          <ResizablePanel
            ref={deckPanelRef}
            defaultSize={58}
            minSize={35}
            className="min-w-0"
          >
            {artifactPane}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="min-w-0 flex-1">{conversation}</div>
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

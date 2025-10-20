import React from 'react';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatInputSection } from './ChatInputSection';
import { RightPanelContainer } from './RightPanelContainer';
import { Message } from '../../types/chat';
import { MissionPhase } from '../MissionProgressIndicator';
import SubscriptionDialog from '../SubscriptionDialog';

type ViewMode = 'build' | 'files' | 'presentation';

interface ProjectData {
  project_id: string;
  project_name: string;
  project_path: string;
  session_id: string;
}

interface SplitLayoutViewProps {
  // Message area props
  messages: Message[];
  isLoadingHistory: boolean;
  isStreaming: boolean;
  missionPhase: MissionPhase;
  projectData: ProjectData | null;
  currentStep: string;
  executionProgress: number;

  // Input section props
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFilesUploaded: (fileIds: string[], fileDetails: any[]) => void;
  attachedFileIds: string[];
  attachedFileDetails: any[];
  setAttachedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAttachedFileDetails: React.Dispatch<React.SetStateAction<any[]>>;

  // Right panel props
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  presentations: Array<{ id: string; created_at: string }>;
  selectedPresentationId: string | null;
  setSelectedPresentationId: (id: string | null) => void;
  presentationHtml: string;
  setPresentationHtml: (html: string) => void;
  refreshTrigger: number;
  isLoadingPreview: boolean;
  onView: () => void;
  onCloseRightPanel: () => void;
  onExportPDF: () => void;
  onDownloadProject: () => void;
  onDeleteProject: () => void;

  // Subscription dialog
  showSubscriptionDialog: boolean;
  onSubscriptionDialogChange: (open: boolean) => void;
  onSubscribed: () => void;
  subscriptionMessage: string;
}

export const SplitLayoutView: React.FC<SplitLayoutViewProps> = (props) => {
  const {
    messages,
    isLoadingHistory,
    isStreaming,
    missionPhase,
    projectData,
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
    viewMode,
    setViewMode,
    presentations,
    selectedPresentationId,
    setSelectedPresentationId,
    presentationHtml,
    setPresentationHtml,
    refreshTrigger,
    isLoadingPreview,
    onView,
    onCloseRightPanel,
    onExportPDF,
    onDownloadProject,
    onDeleteProject,
    showSubscriptionDialog,
    onSubscriptionDialogChange,
    onSubscribed,
    subscriptionMessage
  } = props;

  return (
    <div className="h-screen w-full max-w-full flex overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-background dark:to-background" data-chat-interface style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Left Side: Mission Chat - 35% */}
      <div className="w-[35%] max-w-[35%] flex flex-col overflow-hidden min-w-0" style={{ width: '35%', maxWidth: '35%', minWidth: '0' }}>
        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
          <div className="p-4 min-w-0" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <ChatMessageArea
              messages={messages}
              isLoadingHistory={isLoadingHistory}
              isStreaming={isStreaming}
              missionPhase={missionPhase}
              projectName={projectData?.project_name}
              currentStep={currentStep}
              executionProgress={executionProgress}
            />
          </div>
        </div>

        {/* Fixed Input Bar */}
        <div className="flex-shrink-0 p-4 border-t bg-background">
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

      {/* Right Side: Project Preview - 65% */}
      <RightPanelContainer
        projectData={projectData}
        viewMode={viewMode}
        setViewMode={setViewMode}
        presentations={presentations}
        selectedPresentationId={selectedPresentationId}
        setSelectedPresentationId={setSelectedPresentationId}
        presentationHtml={presentationHtml}
        setPresentationHtml={setPresentationHtml}
        refreshTrigger={refreshTrigger}
        isLoadingPreview={isLoadingPreview}
        onView={onView}
        onClose={onCloseRightPanel}
        onExportPDF={onExportPDF}
        onDownloadProject={onDownloadProject}
        onDeleteProject={onDeleteProject}
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

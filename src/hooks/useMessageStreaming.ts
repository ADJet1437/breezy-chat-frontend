import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedPost } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { Message } from '../types/chat';
import { PaymentRequiredError, handleApiError } from '../utils/errorHandler';
import { MissionPhase } from '../components/MissionProgressIndicator';

interface ProjectData {
  project_id: string;
  project_name: string;
  project_path: string;
  session_id: string;
}

interface UseMessageStreamingProps {
  missionId?: string;
  currentMissionId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setCurrentMissionId: (id: string) => void;
  projectData: ProjectData | null;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData | null>>;
  projectDataRef: React.MutableRefObject<ProjectData | null>;
  showRightPanel: boolean;
  setShowRightPanel: (show: boolean) => void;
  setViewMode: (mode: 'build' | 'files' | 'presentation') => void;
  setPresentationHtml: React.Dispatch<React.SetStateAction<string>>;
  setPresentations: React.Dispatch<React.SetStateAction<Array<{ id: string; created_at: string }>>>;
  setSelectedPresentationId: React.Dispatch<React.SetStateAction<string | null>>;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  attachedFileIds: string[];
  setAttachedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAttachedFileDetails: React.Dispatch<React.SetStateAction<any[]>>;
  inputBarRef: React.RefObject<{ focusInput: () => void }>;
}

interface UseMessageStreamingReturn {
  isStreaming: boolean;
  missionPhase: MissionPhase;
  executionProgress: number;
  currentStep: string;
  isPresentationStreaming: boolean;
  setIsPresentationStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  sendMessageToBackend: (message: string, overrideFileIds?: string[]) => Promise<void>;
  showSubscriptionDialog: boolean;
  setShowSubscriptionDialog: React.Dispatch<React.SetStateAction<boolean>>;
  subscriptionMessage: string;
  pendingMessage: string | null;
  setPendingMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useMessageStreaming = (props: UseMessageStreamingProps): UseMessageStreamingReturn => {
  const {
    missionId,
    currentMissionId,
    messages,
    setMessages,
    setCurrentMissionId,
    projectData,
    setProjectData,
    projectDataRef,
    showRightPanel,
    setShowRightPanel,
    setViewMode,
    setPresentationHtml,
    setPresentations,
    setSelectedPresentationId,
    setRefreshTrigger,
    attachedFileIds,
    setAttachedFileIds,
    setAttachedFileDetails,
    inputBarRef
  } = props;

  const [isStreaming, setIsStreaming] = useState(false);
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('init');
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isPresentationStreaming, setIsPresentationStreaming] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const sendMessageToBackend = async (message: string, overrideFileIds?: string[]) => {
    const effectiveMissionId = missionId || currentMissionId;
    let newMissionId: string | null = null;

    setIsStreaming(true);

    try {
      const requestPayload: any = {
        message: message,
        file_ids: overrideFileIds !== undefined ? overrideFileIds : attachedFileIds
      };

      if (effectiveMissionId) {
        requestPayload.mission_id = effectiveMissionId;
      }

      const response = await authenticatedPost(buildApiUrl('/api/v1/missions/complete'), requestPayload);
      await handleApiError(response, 'Chat Message');

      const botMessageId = (Date.now() + 1).toString();
      let initialBotMessageCreated = false;

      const createInitialBotMessage = () => {
        if (!initialBotMessageCreated) {
          const botMessage: Message = {
            id: botMessageId,
            content: '',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
          initialBotMessageCreated = true;
        }
      };

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || !jsonStr.startsWith('{')) continue;

                const data = JSON.parse(jsonStr);

                if (data.event_type === 'mission_init') {
                  newMissionId = data.answer;
                  setCurrentMissionId(data.answer);
                  setMissionPhase('init');
                } else if (data.event_type === 'project_created') {
                  const projectInfo = data.data;
                  if (projectInfo && projectInfo.project_id) {
                    const newProjectData = {
                      project_id: projectInfo.project_id,
                      project_name: projectInfo.project_name,
                      project_path: projectInfo.project_path,
                      session_id: projectInfo.session_id
                    };
                    setProjectData(newProjectData);
                    projectDataRef.current = newProjectData;
                    setMissionPhase('project_created');
                    setShowRightPanel(false);
                  }
                } else if (data.event_type === 'execution_init') {
                  setMissionPhase('execution');
                  setExecutionProgress(10);
                  setCurrentStep('Starting development...');
                } else if (data.event_type === 'tool_call') {
                  const customMessage = data.data.message || `🔧 Using: ${data.data.tool_name || 'unknown tool'}`;
                  setCurrentStep(customMessage);
                  setExecutionProgress(prev => Math.min(prev + 10, 85));

                  if (data.data?.tool_name === 'create_presentation') {
                    setPresentationHtml('');
                    setIsPresentationStreaming(true);
                    setViewMode('presentation');
                    setShowRightPanel(true);
                  }

                  if (data.data?.tool_name === 'task_complete') {
                    const requiresRefresh = data.data?.tool_result?.metadata?.requires_preview_refresh;
                    if (requiresRefresh === true && showRightPanel && projectData?.project_id) {
                      setRefreshTrigger(prev => prev + 1);
                    }
                  }
                } else if (data.event_type === 'tool_start' && data.data?.tool_name === 'image_generation') {
                  const skeletonMessage: Message = {
                    id: botMessageId,
                    content: data.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'image-generating',
                    prompt: data.data.message.replace('🎨 Generating image: ', '').replace(/\.\.\..*$/, '')
                  };
                  setMessages(prev => [...prev, skeletonMessage]);
                  initialBotMessageCreated = true;
                } else if (data.event_type === 'tool_start' && data.data?.tool_name === 'image_editing') {
                  const skeletonMessage: Message = {
                    id: botMessageId,
                    content: data.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'image-editing',
                    prompt: data.data.message.replace('✏️ Editing image: ', '').replace(/\.\.\..*$/, '')
                  };
                  setMessages(prev => [...prev, skeletonMessage]);
                  initialBotMessageCreated = true;
                } else if (data.event_type === 'tool_complete' && data.data?.tool_name === 'image_generation') {
                  const result = data.data.result;
                  if (result && result.base64_image) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === botMessageId && msg.type === 'image-generating'
                        ? {
                            ...msg,
                            type: 'image',
                            imageUrl: result.base64_image,
                            imageAlt: result.image_filename,
                            filename: result.image_filename,
                            prompt: result.prompt,
                            isLoaded: true
                          }
                        : msg
                    ));
                  }
                } else if (data.event_type === 'tool_complete' && data.data?.tool_name === 'image_editing') {
                  const result = data.data.result;
                  if (result && result.base64_image) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === botMessageId && msg.type === 'image-editing'
                        ? {
                            ...msg,
                            type: 'image',
                            imageUrl: result.base64_image,
                            imageAlt: result.image_filename,
                            filename: result.image_filename,
                            prompt: result.prompt,
                            isLoaded: true
                          }
                        : msg
                    ));
                  }
                } else if (data.event_type === 'execution_reflection') {
                  const message = data.data.message || 'Processing...';
                  setCurrentStep(`💭 ${message}`);
                  setExecutionProgress(prev => Math.min(prev + 5, 90));
                } else if (data.event_type === 'presentation_content') {
                  const htmlChunk = data.data.html_chunk || '';
                  setPresentationHtml(prev => prev + htmlChunk);
                } else if (data.event_type === 'execution_complete') {
                  setMissionPhase('complete');
                  setExecutionProgress(100);

                  if (data.data.presentation_html && data.data.presentation_id) {
                    const newPresentation = {
                      id: data.data.presentation_id,
                      created_at: new Date().toISOString(),
                    };

                    setPresentations(prev => [newPresentation, ...prev]);
                    setSelectedPresentationId(data.data.presentation_id);
                    setPresentationHtml(data.data.presentation_html);
                    setViewMode('presentation');
                    setCurrentStep('✅ Presentation created!');
                    setShowRightPanel(true);
                    setIsPresentationStreaming(false);
                    newMissionId = null;
                  } else {
                    setCurrentStep('✅ Mission completed! Launching code agent...');

                    const currentProjectData = projectDataRef.current || projectData;
                    if (currentProjectData?.project_id) {
                      setViewMode('build');
                      setTimeout(() => {
                        setShowRightPanel(true);
                      }, 1000);
                    }
                  }
                } else if (data.event_type === 'mission_content') {
                  createInitialBotMessage();
                  setMessages(prev => prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, content: msg.content + data.answer }
                      : msg
                  ));
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof PaymentRequiredError) {
        let dialogMessage = '';
        if (error.errorCode === 'SUBSCRIPTION_REQUIRED') {
          dialogMessage = 'Please subscribe to continue chatting with our AI assistant.';
        } else if (error.errorCode === 'TRIAL_LIMIT_EXCEEDED') {
          dialogMessage = 'You\'ve reached your daily message limit for the Trial plan. Upgrade to continue chatting.';
        } else {
          dialogMessage = 'Please upgrade your subscription to continue.';
        }

        setSubscriptionMessage(dialogMessage);
        setPendingMessage(message);
        setShowSubscriptionDialog(true);
        return;
      }

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Sorry, I'm having trouble connecting to the server. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setAttachedFileIds([]);
      setAttachedFileDetails([]);

      if (!missionId && newMissionId) {
        navigate(`/missions/${newMissionId}`);
      } else {
        inputBarRef.current?.focusInput();
      }
    }
  };

  return {
    isStreaming,
    missionPhase,
    executionProgress,
    currentStep,
    isPresentationStreaming,
    setIsPresentationStreaming,
    sendMessageToBackend,
    showSubscriptionDialog,
    setShowSubscriptionDialog,
    subscriptionMessage,
    pendingMessage,
    setPendingMessage
  };
};

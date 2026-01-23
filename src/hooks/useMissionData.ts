import { useState, useEffect, useRef } from 'react';
import { authenticatedGet } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { Message } from '../types/chat';

interface TextBlockResponse {
  id: string;
  type: "text";
  created_at: string;
  text: string;
}

interface ToolUseBlockResponse {
  id: string;
  type: "tool_use";
  created_at: string;
  tool_name: string;
  tool_call_id: string;
  tool_input: any;
  tool_output: any;
}

interface ImageBlockResponse {
  id: string;
  type: "image";
  created_at: string;
  image_url: string;
  alt_text: string;
}

type ContentBlock = TextBlockResponse | ToolUseBlockResponse | ImageBlockResponse;

interface TaskMessage {
  id: string;
  role: "user" | "assistant";
  created_at: string;
  mission_id: string;
  content_blocks: ContentBlock[];
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

interface ProjectData {
  project_id: string;
  project_name: string;
  project_path: string;
  session_id: string;
}

interface UseMissionDataReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  projectData: ProjectData | null;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData | null>>;
  projectDataRef: React.MutableRefObject<ProjectData | null>;
  isLoadingHistory: boolean;
  presentations: Array<{ id: string; created_at: string }>;
  setPresentations: React.Dispatch<React.SetStateAction<Array<{ id: string; created_at: string }>>>;
  selectedPresentationId: string | null;
  setSelectedPresentationId: React.Dispatch<React.SetStateAction<string | null>>;
  presentationHtml: string;
  setPresentationHtml: React.Dispatch<React.SetStateAction<string>>;
  isProjectReady: boolean;
  setIsProjectReady: React.Dispatch<React.SetStateAction<boolean>>;
  loadMissionHistory: (missionId: string) => Promise<void>;
  processMissionData: (missionDetails: MissionDetails) => void;
}

export const useMissionData = (
  missionId: string | undefined,
  currentMissionId: string | null,
  missionData: MissionDetails | null | undefined,
  isParentLoading: boolean,
  setMissionData: (id: string, llmId: string) => void,
  setViewMode: (mode: 'build' | 'files' | 'presentation') => void,
  setShowRightPanel: (show: boolean) => void
): UseMissionDataReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [presentations, setPresentations] = useState<Array<{ id: string; created_at: string }>>([]);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);
  const [presentationHtml, setPresentationHtml] = useState<string>('');
  const [isProjectReady, setIsProjectReady] = useState<boolean>(false);
  const projectDataRef = useRef<ProjectData | null>(null);

  const processMissionData = (missionDetails: MissionDetails) => {
    // Store mission data atomically in context
    setMissionData(missionDetails.id, missionDetails.llm_id);

    // Check if mission has a completed code agent and set up project data
    if (missionDetails.code_agent && missionDetails.code_agent.id) {
      const agentId = missionDetails.code_agent.id;

      const projectInfo = {
        project_id: agentId,
        project_name: missionDetails.name,
        project_path: '',
        session_id: agentId
      };

      setProjectData(projectInfo);
      projectDataRef.current = projectInfo;
      setViewMode('build');
      // For existing missions loaded from backend, project is already complete and ready
      setIsProjectReady(true);
    } else {
      // No project exists yet - this is a new mission
      setIsProjectReady(false);
    }

    // Transform task_messages to Message format
    const historyMessages: Message[] = [];

    missionDetails.task_messages.forEach((taskMessage) => {
      // Extract text content from TextBlocks
      const textBlocks = taskMessage.content_blocks.filter(
        (block): block is TextBlockResponse => block.type === 'text'
      );
      const textContent = textBlocks.map(block => block.text).join('\n');

      // Extract image blocks
      const imageBlocks = taskMessage.content_blocks.filter(
        (block): block is ImageBlockResponse => block.type === 'image'
      );

      // Add main text message if there's text content
      if (textContent) {
        historyMessages.push({
          id: taskMessage.id,
          content: textContent,
          sender: taskMessage.role === 'user' ? 'user' : 'bot',
          timestamp: new Date(taskMessage.created_at),
        });
      }

      // Add separate ImageMessage for each image block
      imageBlocks.forEach(imageBlock => {
        historyMessages.push({
          id: `${taskMessage.id}_image_${imageBlock.id}`,
          content: '',
          sender: 'bot',
          timestamp: new Date(taskMessage.created_at),
          type: 'image',
          imageUrl: imageBlock.image_url,
          imageAlt: imageBlock.alt_text,
          filename: imageBlock.alt_text,
          prompt: textContent,
          isLoaded: true
        });
      });
    });

    setMessages(historyMessages);
  };

  const loadMissionHistory = async (missionId: string) => {
    setIsLoadingHistory(true);

    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/missions/${missionId}`));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const missionDetails: MissionDetails = await response.json();
      processMissionData(missionDetails);

      // Try to load presentations list
      try {
        const presentationsResponse = await authenticatedGet(
          buildApiUrl(`/api/v1/missions/${missionId}/presentations`)
        );

        if (presentationsResponse.ok) {
          const data = await presentationsResponse.json();
          const presentationsList = data.presentations || [];

          if (presentationsList.length > 0) {
            setViewMode('presentation');
            setPresentations(presentationsList);

            const latest = presentationsList[0];
            setSelectedPresentationId(latest.id);

            const htmlResponse = await authenticatedGet(
              buildApiUrl(`/api/v1/presentations/${latest.id}`)
            );

            if (htmlResponse.ok) {
              const htmlData = await htmlResponse.json();
              setPresentationHtml(htmlData.html_content);
              setShowRightPanel(true);
            }
          }
        }
      } catch (presentationError) {
        // No presentations exist, silently continue
      }
    } catch (error) {
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load mission history when missionId changes
  useEffect(() => {
    // Use only explicit missionId prop - no fallback to avoid race conditions
    const effectiveMissionId = missionId;

    if (missionData && missionData.id === effectiveMissionId) {
      processMissionData(missionData);
    } else if (effectiveMissionId && !missionData && !isParentLoading) {
      loadMissionHistory(effectiveMissionId);
    } else if (!effectiveMissionId) {
      // No mission ID - clear messages (new mission scenario)
      setMessages([]);
    }
  }, [missionId, missionData, isParentLoading]);

  return {
    messages,
    setMessages,
    projectData,
    setProjectData,
    projectDataRef,
    isLoadingHistory,
    presentations,
    setPresentations,
    selectedPresentationId,
    setSelectedPresentationId,
    presentationHtml,
    setPresentationHtml,
    isProjectReady,
    setIsProjectReady,
    loadMissionHistory,
    processMissionData
  };
};

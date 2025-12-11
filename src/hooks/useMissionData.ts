import { useState, useEffect, useRef } from 'react';
import { authenticatedGet } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { Message } from '../types/chat';

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
    }

    // Transform task_messages to Message format
    const historyMessages: Message[] = [];

    missionDetails.task_messages.forEach((taskMessage) => {
      historyMessages.push({
        id: taskMessage.id,
        content: taskMessage.content,
        sender: taskMessage.role === 'user' ? 'user' : 'bot',
        timestamp: new Date(taskMessage.created_at),
        attachedFiles: taskMessage.files ? taskMessage.files
          .filter(file => taskMessage.role === 'user' ? file.source === 'upload' : true)
          .map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type
          })) : undefined,
      });

      // Add separate ImageMessage for each image
      if (taskMessage.images && taskMessage.images.length > 0) {
        taskMessage.images.forEach(image => {
          historyMessages.push({
            id: `${taskMessage.id}_image_${image.id}`,
            content: '',
            sender: 'bot',
            timestamp: new Date(taskMessage.created_at),
            type: 'image',
            imageUrl: buildApiUrl(`/api/v1/files/${image.id}`),
            imageAlt: image.name,
            filename: image.name,
            prompt: taskMessage.content,
            isLoaded: true
          });
        });
      }
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
    loadMissionHistory,
    processMissionData
  };
};

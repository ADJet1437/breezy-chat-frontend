import { useState, useEffect } from 'react';
import { authenticatedGet } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { Message } from '../types/chat';

interface TextBlockResponse {
  id: string;
  type: "text";
  created_at: string;
  text: string;
}

interface ThinkingBlockResponse {
  id: string;
  type: "thinking";
  created_at: string;
  thinking_content: string;
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

type ContentBlock =
  | TextBlockResponse
  | ThinkingBlockResponse
  | ToolUseBlockResponse
  | ImageBlockResponse;

interface TaskMessage {
  id: string;
  role: "user" | "assistant";
  created_at: string;
  mission_id: string;
  content_blocks: ContentBlock[];
}

export interface MissionDetails {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  llm_id: string;
  system_prompt?: string;
  task_messages: TaskMessage[];
}

interface UseMissionDataReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoadingHistory: boolean;
  loadMissionHistory: (missionId: string) => Promise<void>;
  processMissionData: (missionDetails: MissionDetails) => void;
}

export const useMissionData = (
  missionId: string | undefined,
  currentMissionId: string | null,
  missionData: MissionDetails | null | undefined,
  isParentLoading: boolean,
  setMissionData: (id: string, llmId: string) => void
): UseMissionDataReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const processMissionData = (missionDetails: MissionDetails) => {
    // Store mission data atomically in context
    setMissionData(missionDetails.id, missionDetails.llm_id);

    // Transform task_messages to Message format
    const historyMessages: Message[] = [];

    missionDetails.task_messages.forEach((taskMessage) => {
      // One pass, in block order. This used to be four filter passes that
      // pushed text, then thinking, then tools, then images -- so the
      // transcript showed a fixed sequence of types rather than what actually
      // happened, and every text block was joined into a single bubble, which
      // made text between two tool calls impossible to render in place.
      //
      // created_at is stamped by the backend when each segment began, so it
      // is the order the turn happened in. id breaks ties.
      const blocks = [...taskMessage.content_blocks].sort((a, b) => {
        const byTime = Date.parse(a.created_at) - Date.parse(b.created_at);
        return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
      });

      // Only for an image's caption, which has no text of its own.
      const turnText = blocks
        .filter((block): block is TextBlockResponse => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const sender = taskMessage.role === 'user' ? 'user' : 'bot';

      blocks.forEach(block => {
        switch (block.type) {
          case 'text':
            historyMessages.push({
              id: `${taskMessage.id}_text_${block.id}`,
              content: block.text,
              sender,
              timestamp: new Date(block.created_at),
            });
            break;

          case 'thinking':
            historyMessages.push({
              id: `${taskMessage.id}_thinking_${block.id}`,
              content: block.thinking_content,
              sender: 'bot',
              timestamp: new Date(block.created_at),
              type: 'thinking',
            });
            break;

          case 'tool_use': {
            const output = block.tool_output || {};
            historyMessages.push({
              id: `${taskMessage.id}_tool_${block.id}`,
              content: '',
              sender: 'bot',
              timestamp: new Date(block.created_at),
              type: 'tool-use',
              toolName: block.tool_name,
              toolSummary: typeof output.message === 'string' ? output.message : undefined,
              toolFailed: output.status === 'error',
              // What the tool reported while it ran. The backend keeps this
              // now, so a finished call opens the same way on a reload as it
              // did live -- it used to collapse to a bare line the moment the
              // page was refreshed.
              toolProgress: Array.isArray(output.steps)
                ? output.steps.filter((step: unknown): step is string =>
                    typeof step === 'string'
                  )
                : undefined,
            });
            break;
          }

          case 'image':
            historyMessages.push({
              id: `${taskMessage.id}_image_${block.id}`,
              content: '',
              sender: 'bot',
              timestamp: new Date(block.created_at),
              type: 'image',
              imageUrl: block.image_url,
              imageAlt: block.alt_text,
              filename: block.alt_text,
              prompt: turnText,
              isLoaded: true,
            });
            break;
        }
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
    isLoadingHistory,
    loadMissionHistory,
    processMissionData
  };
};


export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  source?: string; // "upload" or "generated"
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
  type?: 'text' | 'image' | 'image-generating' | 'image-editing' | 'tool-use' | 'thinking';
  /** For 'tool-use': what the agent did, drawn as a chip rather than prose. */
  toolName?: string;
  toolSummary?: string;
  toolFailed?: boolean;
  toolRunning?: boolean;
  /** Every line the tool has reported this turn, oldest first. */
  toolProgress?: string[];
  /** For 'thinking': still streaming. */
  thinkingStreaming?: boolean;
  attachedFiles?: AttachedFile[];
  imageUrl?: string;
  imageAlt?: string;
  prompt?: string;
  filename?: string;
  isLoaded?: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
}

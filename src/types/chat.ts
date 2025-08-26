
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
  type?: 'text' | 'image' | 'image-generating' | 'image-editing';
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

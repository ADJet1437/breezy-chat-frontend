
export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  attachedFiles?: AttachedFile[];
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
}

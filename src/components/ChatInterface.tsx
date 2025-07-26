import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedGet, authenticatedPost } from '../utils/authenticatedFetch';
import { PaymentRequiredError, handleApiError } from '../utils/errorHandler';
import { buildApiUrl } from '../utils/apiConfig';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import SubscriptionDialog from './SubscriptionDialog';
import ChatStickyInputBar, { ChatStickyInputBarRef } from './ChatStickyInputBar';
import { Message } from '../types/chat';

interface TaskMessage {
  id: string;
  message: string;
  answer: string;
  created_at: string;
  mission_id: string;
  file_ids: string[];
  files?: {
    id: string;
    name: string;
    size: number;
    type: string;
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
}

interface ChatInterfaceProps {
  missionId?: string;
  rightSidebarVisible?: boolean;
}

const ChatInterface = ({ missionId, rightSidebarVisible = false }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load from localStorage, same as Layout component
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [attachedFileDetails, setAttachedFileDetails] = useState<any[]>([]);
  const { currentMissionId, setCurrentMissionId } = useMissionContext();
  const { isAuthenticated, accessToken, user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<ChatStickyInputBarRef>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        const newState = JSON.parse(saved);
        if (newState !== sidebarCollapsed) {
          setSidebarCollapsed(newState);
        }
      }
    };

    // Listen for localStorage changes (for programmatic sidebar collapse)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage is updated in same tab
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [sidebarCollapsed]);

  // Load mission history when missionId changes
  useEffect(() => {
    const effectiveMissionId = missionId || currentMissionId;
    if (effectiveMissionId) {
      loadMissionHistory(effectiveMissionId);
    } else {
      // Clear messages when starting a new mission
      setMessages([]);
    }
  }, [missionId, currentMissionId]);

  const loadMissionHistory = async (missionId: string) => {
    console.log('Loading mission history for:', missionId);
    setIsLoadingHistory(true);
    
    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/missions/${missionId}`));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const missionDetails: MissionDetails = await response.json();
      console.log('Mission details loaded:', missionDetails);

      // Transform task_messages to Message format
      const historyMessages: Message[] = [];
      
      missionDetails.task_messages.forEach((taskMessage) => {
        // Add user message with file attachments
        historyMessages.push({
          id: `${taskMessage.id}_user`,
          content: taskMessage.message,
          sender: 'user',
          timestamp: new Date(taskMessage.created_at),
          attachedFiles: taskMessage.files ? taskMessage.files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type
          })) : undefined,
        });

        // Add bot response
        historyMessages.push({
          id: `${taskMessage.id}_bot`,
          content: taskMessage.answer,
          sender: 'bot',
          timestamp: new Date(taskMessage.created_at),
        });
      });

      // Set the messages to the loaded history
      setMessages(historyMessages);
      console.log('Mission history loaded successfully:', historyMessages.length, 'messages');
      
    } catch (error) {
      console.error('Error loading mission history:', error);
      toast({
        description: "Failed to load mission history. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      
      // Keep messages empty on error
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };


  const sendMessageToBackend = async (message: string) => {
    const effectiveMissionId = missionId || currentMissionId;
    let newMissionId: string | null = null; // Track new mission ID for navigation
    console.log('🎯 === SENDING MESSAGE TO BACKEND ===');
    console.log('🎯 Message:', message);
    console.log('🎯 Effective mission ID:', effectiveMissionId);
    
    // Check authentication state before making API call
    console.log('🔐 === AUTH STATE CHECK ===');
    console.log('🔐 isAuthenticated:', isAuthenticated);
    console.log('🔐 accessToken exists:', !!accessToken);
    console.log('🔐 user:', user?.email);
    
    if (!isAuthenticated) {
      console.log('🔐 ❌ NOT AUTHENTICATED - Request may fail');
    } else {
      console.log('🔐 ✅ AUTHENTICATED - Proceeding with request');
    }
    
    try {
      // Prepare request payload - include mission_id only if we have one
      const requestPayload: any = {
        message: message,
        llm: 'gpt-4o',
        file_ids: attachedFileIds
      };

      if (effectiveMissionId) {
        requestPayload.mission_id = effectiveMissionId;
        console.log('Including mission_id in request:', effectiveMissionId);
      } else {
        console.log('No mission_id - this will create a new mission');
      }

      if (attachedFileIds.length > 0) {
        console.log('Including file_ids in request:', attachedFileIds);
      }

      const response = await authenticatedPost(buildApiUrl('/api/v1/missions/complete'), requestPayload);

      console.log('Response received:', response.status, response.ok);

      // Use handleApiError to properly throw PaymentRequiredError for 402 responses
      await handleApiError(response, 'Chat Message');

      // Create initial bot message with empty content
      const botMessageId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMessageId,
        content: '',
        sender: 'bot',
        timestamp: new Date(),
      };

      console.log('Adding initial bot message with id:', botMessageId);
      setMessages(prev => [...prev, botMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        console.log('Starting to read stream...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream reading completed');
            break;
          }

          const chunk = decoder.decode(value);
          console.log('Received chunk:', chunk);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                console.log('Parsing JSON:', jsonStr);
                const data = JSON.parse(jsonStr);
                console.log('Parsed data:', data);
                
                if (data.event_type === 'mission_init') {
                  console.log('Received mission_init event with mission_id:', data.answer);
                  newMissionId = data.answer; // Store for navigation
                  setCurrentMissionId(data.answer);
                } else if (data.event_type === 'mission_content') {
                  console.log('Updating message content with:', data.answer);
                  // Update the bot message content by appending the new content
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                      ? { ...msg, content: msg.content + data.answer }
                      : msg
                  ));
                }
              } catch (error) {
                console.error('Error parsing JSON:', error, 'Line:', line);
              }
            }
          }
        }
      } else {
        console.error('No reader available from response body');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error instanceof PaymentRequiredError) {
        // Handle 402 Payment Required errors
        // Set appropriate message based on error code
        let dialogMessage = '';
        if (error.errorCode === 'SUBSCRIPTION_REQUIRED') {
          dialogMessage = 'Please subscribe to continue chatting with our AI assistant.';
        } else if (error.errorCode === 'TRIAL_LIMIT_EXCEEDED') {
          dialogMessage = 'You\'ve reached your daily message limit for the Trial plan. Upgrade to continue chatting.';
        } else {
          dialogMessage = 'Please upgrade your subscription to continue.';
        }
        
        setSubscriptionMessage(dialogMessage);
        setPendingMessage(message); // Store the message to retry after subscription
        setShowSubscriptionDialog(true);
        
        // Don't show generic error toast for payment errors
        return;
      }
      
      toast({
        description: "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Sorry, I'm having trouble connecting to the server. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      // Clear attached files after sending
      setAttachedFileIds([]);
      setAttachedFileDetails([]);
      
      // If we're on root route and created a new mission, navigate to mission detail
      if (!missionId && newMissionId) {
        console.log('Navigating to new mission detail:', newMissionId);
        navigate(`/missions/${newMissionId}`);
      } else {
        // Focus input after streaming completes so user can immediately type next message
        inputBarRef.current?.focusInput();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    console.log('Handling send message:', inputValue);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      attachedFiles: attachedFileDetails.length > 0 ? attachedFileDetails.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type
      })) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    setIsStreaming(true);
    console.log('Set isStreaming to true');

    // Focus input immediately after clearing for immediate next message typing
    inputBarRef.current?.focusInput();

    await sendMessageToBackend(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubscriptionSuccess = async () => {
    setShowSubscriptionDialog(false);
    
    toast({
      description: "Subscription successful! You can now continue chatting.",
      duration: 3000,
    });

    // If we have a pending message, retry sending it
    if (pendingMessage) {
      
      // Add the user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        content: pendingMessage,
        sender: 'user',
        timestamp: new Date(),
        attachedFiles: undefined,
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Clear pending message and send it
      const messageToRetry = pendingMessage;
      setPendingMessage(null);
      setIsStreaming(true);
      
      await sendMessageToBackend(messageToRetry);
    }
    
    // Focus input after subscription success
    inputBarRef.current?.focusInput();
  };

  const handleSubscriptionCancel = () => {
    setShowSubscriptionDialog(false);
    setPendingMessage(null); // Clear pending message
  };

  const handleFilesUploaded = (fileIds: string[], fileDetails: any[]) => {
    setAttachedFileIds(fileIds);
    setAttachedFileDetails(fileDetails);
    toast({
      description: `${fileIds.length} file(s) attached to your message`,
      duration: 3000,
    });
  };

  const removeAttachedFile = (indexToRemove: number) => {
    setAttachedFileIds(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <>
      {/* Messages Area with bottom padding for sticky input */}
      <div className="flex flex-col h-full pb-32">
        <div className="flex-1 min-h-0 p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <ScrollArea className="flex-1">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading mission history...</p>
                  </div>
                </div>
              ) : (
                <>
                  <MessageList messages={messages} />
                  {isStreaming && <TypingIndicator />}
                </>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Sticky Input Bar */}
      <ChatStickyInputBar
        ref={inputBarRef}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        onFilesUploaded={handleFilesUploaded}
        attachedFileIds={attachedFileIds}
        attachedFileDetails={attachedFileDetails}
        setAttachedFileIds={setAttachedFileIds}
        setAttachedFileDetails={setAttachedFileDetails}
        isStreaming={isStreaming}
        isLoadingHistory={isLoadingHistory}
        missionId={missionId}
        currentMissionId={currentMissionId}
        rightSidebarVisible={rightSidebarVisible}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Subscription Dialog */}
      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleSubscriptionCancel();
          }
        }}
        onSubscribed={handleSubscriptionSuccess}
        message={subscriptionMessage}
      />
    </>
  );
};

export default ChatInterface;

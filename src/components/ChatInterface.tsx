import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../contexts/MissionContext';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import { Message } from '../types/chat';

interface TaskMessage {
  id: string;
  message: string;
  answer: string;
  created_at: string;
  mission_id: string;
}

interface MissionDetails {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  llm_id: string;
  task_messages: TaskMessage[];
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { currentMissionId, setCurrentMissionId } = useMissionContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load mission history when currentMissionId changes
  useEffect(() => {
    if (currentMissionId) {
      loadMissionHistory(currentMissionId);
    }
  }, [currentMissionId]);

  const loadMissionHistory = async (missionId: string) => {
    console.log('Loading mission history for:', missionId);
    setIsLoadingHistory(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/missions/${missionId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const missionDetails: MissionDetails = await response.json();
      console.log('Mission details loaded:', missionDetails);

      // Transform task_messages to Message format
      const historyMessages: Message[] = [];
      
      missionDetails.task_messages.forEach((taskMessage) => {
        // Add user message
        historyMessages.push({
          id: `${taskMessage.id}_user`,
          content: taskMessage.message,
          sender: 'user',
          timestamp: new Date(taskMessage.created_at),
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
      
      // Keep default welcome message on error
      setMessages([
        {
          id: '1',
          content: "Hello! I'm your AI assistant. How can I help you today?",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewMission = () => {
    setMessages([
      {
        id: '1',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setInputValue('');
    setCurrentMissionId(null); // Clear mission ID to start a new mission
    console.log('Cleared mission ID for new mission');
    toast({
      description: "New mission started!",
      duration: 2000,
    });
  };

  const sendMessageToBackend = async (message: string) => {
    console.log('Starting to send message:', message);
    console.log('Current mission ID:', currentMissionId);
    try {
      // Prepare request payload - include mission_id only if we have one
      const requestPayload: any = {
        message: message,
        llm: 'gpt-4o'
      };

      if (currentMissionId) {
        requestPayload.mission_id = currentMissionId;
        console.log('Including mission_id in request:', currentMissionId);
      } else {
        console.log('No mission_id - this will create a new mission');
      }

      const response = await fetch('http://localhost:8000/api/v1/missions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('Response received:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      console.log('Setting isStreaming to false');
      setIsStreaming(false);
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
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    setIsStreaming(true);
    console.log('Set isStreaming to true');

    await sendMessageToBackend(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
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

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                disabled={isStreaming || isLoadingHistory}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming || isLoadingHistory}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

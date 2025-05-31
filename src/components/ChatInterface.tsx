
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import { Message } from '../types/chat';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    toast({
      description: "New mission started!",
      duration: 2000,
    });
  };

  const sendMessageToBackend = async (message: string) => {
    console.log('Starting to send message:', message);
    try {
      const response = await fetch('http://localhost:8000/api/v1/missions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          llm: 'gpt-4o'
        }),
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
                
                if (data.event_type === 'mission_content') {
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600">
              <AvatarFallback className="text-white">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
              <p className="text-sm text-gray-500">Always here to help</p>
            </div>
          </div>
          <Button
            onClick={handleNewMission}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
            disabled={isStreaming}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Mission
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-4">
          <MessageList messages={messages} />
          {isStreaming && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              disabled={isStreaming}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

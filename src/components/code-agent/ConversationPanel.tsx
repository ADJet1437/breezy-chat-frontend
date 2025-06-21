import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2 } from 'lucide-react';
import { ConversationMessage } from './ConversationMessage';
import { ExecutionProgress } from './ExecutionProgress';
import { codeAgentAPI, CodeSession, SSEEvent } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ExecutionState {
  isExecuting: boolean;
  executionId?: string;
  progress: number;
  currentStep: string;
  canCancel: boolean;
}

interface ConversationPanelProps {
  session: CodeSession;
}

export function ConversationPanel({ session }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m ready to help you code. What would you like me to do in this project?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    progress: 0,
    currentStep: '',
    canCancel: false,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelExecutionRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || executionState.isExecuting) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const prompt = inputValue;
    setInputValue('');

    // Start execution
    setExecutionState({
      isExecuting: true,
      executionId: undefined,
      progress: 0,
      currentStep: 'Initializing...',
      canCancel: true,
    });

    try {
      // Use real SSE connection
      const cleanup = codeAgentAPI.executePromptSSE(
        session.session_id,
        { prompt },
        (event: SSEEvent) => {
          handleSSEEvent(event);
        },
        (error: Error) => {
          console.error('Execution failed:', error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          
          setExecutionState({
            isExecuting: false,
            progress: 0,
            currentStep: 'Failed',
            canCancel: false,
          });
          
          toast({
            title: "Execution Error",
            description: error.message,
            variant: "destructive",
          });
        },
        () => {
          // Execution completed
          setExecutionState(prev => ({
            ...prev,
            isExecuting: false,
            canCancel: false,
          }));
        }
      );

      cancelExecutionRef.current = cleanup;
    } catch (error) {
      console.error('Failed to start execution:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I couldn\'t start the execution. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setExecutionState({
        isExecuting: false,
        progress: 0,
        currentStep: '',
        canCancel: false,
      });
    }
  };

  const handleSSEEvent = (event: SSEEvent) => {
    switch (event.event_type) {
      case 'execution_init':
        setExecutionState(prev => ({
          ...prev,
          executionId: event.data.execution_id,
          progress: 10,
          currentStep: 'Starting execution...',
        }));
        break;

      case 'execution_progress':
        setExecutionState(prev => ({
          ...prev,
          progress: event.data.progress_percentage || prev.progress,
          currentStep: event.data.current_step || prev.currentStep,
        }));
        break;

      case 'execution_complete':
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Execution completed successfully! I\'ve processed your request and made the necessary changes.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        setExecutionState(prev => ({
          ...prev,
          progress: 100,
          currentStep: 'Completed',
          isExecuting: false,
          canCancel: false,
        }));
        break;

      case 'execution_error':
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Execution failed: ${event.data.error_message}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        
        setExecutionState({
          isExecuting: false,
          progress: 0,
          currentStep: 'Failed',
          canCancel: false,
        });
        break;

      case 'tool_execution':
        // Could show individual tool executions in the UI
        break;

      default:
        console.log('Unknown SSE event:', event);
    }
  };

  const handleCancelExecution = () => {
    if (cancelExecutionRef.current) {
      cancelExecutionRef.current();
      cancelExecutionRef.current = null;
    }
    
    setExecutionState({
      isExecuting: false,
      progress: 0,
      currentStep: 'Cancelled',
      canCancel: false,
    });

    const cancelMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Execution was cancelled by user.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const examplePrompts = [
    "Add user authentication to this project",
    "Fix any TypeScript errors",
    "Add unit tests for the main components",
    "Implement error handling",
    "Add logging throughout the application",
    "Optimize the database queries",
  ];

  return (
    <>
      {/* Messages Area with bottom padding for sticky input */}
      <div className="flex-1 flex flex-col h-full pb-40">
        {/* Execution Progress - Fixed when active */}
        {executionState.isExecuting && (
          <div className="flex-shrink-0">
            <ExecutionProgress 
              progress={executionState.progress}
              currentStep={executionState.currentStep}
              onCancel={executionState.canCancel ? handleCancelExecution : undefined}
            />
          </div>
        )}

        {/* Conversation Header - Fixed */}
        <div className="p-4 border-b flex-shrink-0">
          <h3 className="font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Conversation
          </h3>
        </div>

        {/* Messages - Scrollable */}
        <div className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto scroll-smooth">
            <div className="p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <ConversationMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Chat Input Area */}
      <div className="fixed bottom-0 right-0 bg-white border-t z-50" style={{ left: 'calc(16rem + 20rem)' }}>
        <div className="p-4">
          <div className="space-y-3">
            {/* Example Prompts */}
            {messages.length <= 1 && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">✨ Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.slice(0, 3).map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setInputValue(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What would you like me to code?"
                disabled={executionState.isExecuting}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || executionState.isExecuting}
              >
                {executionState.isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
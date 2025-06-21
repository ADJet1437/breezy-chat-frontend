import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  Plus, 
  FolderOpen, 
  Send, 
  Bot, 
  User, 
  Camera,
  Loader2,
  X
} from 'lucide-react';
import { CodeSession, codeAgentAPI, SSEEvent } from '@/utils/codeAgentApi';
import { DirectoryExplorer } from './DirectoryExplorer';
import { ConversationMessage } from './ConversationMessage';
import { ExecutionProgress } from './ExecutionProgress';
import { useToast } from '@/hooks/use-toast';

interface ActiveSessionProps {
  session: CodeSession;
  onBack: () => void;
  onCreateNew: () => void;
}

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

export function ActiveSession({ session, onBack, onCreateNew }: ActiveSessionProps) {
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
    console.log('🎯 [ActiveSession] Handling SSE event:', event.event_type, event.data);
    
    switch (event.event_type) {
      case 'execution_init':
        console.log('🚀 [ActiveSession] Initializing execution:', event.data.execution_id);
        setExecutionState(prev => ({
          ...prev,
          executionId: event.data.execution_id,
          progress: 10,
          currentStep: `Initializing agent in ${event.data.working_directory}...`,
          isExecuting: true,
          canCancel: true,
        }));
        
        // Add system message showing initialization
        const initMessage: Message = {
          id: `init-${Date.now()}`,
          type: 'system',
          content: `🤖 Starting code agent in: ${event.data.working_directory}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, initMessage]);
        break;

      case 'execution_progress':
        setExecutionState(prev => ({
          ...prev,
          progress: event.data.progress_percentage || prev.progress,
          currentStep: event.data.current_step || event.data.message || prev.currentStep,
        }));
        break;

      case 'llm_response':
        // Handle streaming LLM responses
        if (event.data.is_partial) {
          // Update or create a streaming assistant message
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.type === 'assistant' && lastMessage.id.includes('streaming')) {
              // Update existing streaming message
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: event.data.accumulated_content || lastMessage.content + (event.data.content || ''),
                }
              ];
            } else {
              // Create new streaming message
              return [
                ...prev,
                {
                  id: `streaming-${Date.now()}`,
                  type: 'assistant' as const,
                  content: event.data.content || '',
                  timestamp: new Date(),
                }
              ];
            }
          });
        }
        break;

      case 'llm_response_complete':
        // Finalize the LLM response
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant' && lastMessage.id.includes('streaming')) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                id: `assistant-${Date.now()}`, // Remove streaming prefix
                content: event.data.final_content || lastMessage.content,
              }
            ];
          }
          return prev;
        });
        break;

      case 'agent_action':
        setExecutionState(prev => ({
          ...prev,
          currentStep: `Planning to use: ${event.data.tool || 'tool'}`,
          progress: Math.min(prev.progress + 5, 90),
        }));
        break;

      case 'tool_execution':
      case 'tool_start':
        const toolName = event.data.tool_name || 'unknown tool';
        setExecutionState(prev => ({
          ...prev,
          currentStep: `Executing: ${toolName}`,
          progress: Math.min(prev.progress + 10, 85),
        }));
        break;

      case 'tool_result':
      case 'tool_end':
        const completedTool = event.data.tool_name || 'tool';
        const success = event.data.success !== false;
        
        setExecutionState(prev => ({
          ...prev,
          currentStep: success ? `✅ Completed: ${completedTool}` : `❌ Failed: ${completedTool}`,
          progress: Math.min(prev.progress + 5, 90),
        }));

        // Show tool execution in chat if it's a significant action
        if (event.data.tool_name && ['write_file', 'execute_command'].includes(event.data.tool_name)) {
          const toolMessage: Message = {
            id: `tool-${Date.now()}`,
            type: 'system',
            content: success 
              ? `🔧 ${completedTool}: ${event.data.result || 'Completed successfully'}`
              : `⚠️ ${completedTool} failed: ${event.data.error || 'Unknown error'}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, toolMessage]);
        }
        break;

      case 'tool_error':
        const errorTool = event.data.tool_name || 'tool';
        setExecutionState(prev => ({
          ...prev,
          currentStep: `❌ Error in: ${errorTool}`,
        }));
        
        const toolErrorMessage: Message = {
          id: `tool-error-${Date.now()}`,
          type: 'system',
          content: `⚠️ Tool error in ${errorTool}: ${event.data.error || 'Unknown error'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, toolErrorMessage]);
        break;

      case 'agent_finish':
        setExecutionState(prev => ({
          ...prev,
          currentStep: 'Finalizing response...',
          progress: 95,
        }));
        break;

      case 'execution_complete':
        // Final completion - extract the actual result
        const result = event.data.result || event.data.message;
        console.log('🏁 [ActiveSession] Execution complete event:', event.data);
        console.log('🏁 [ActiveSession] Extracted result:', result);
        
        // Always add the agent's response to chat
        if (result && result.trim()) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            type: 'assistant' as const,
            content: result,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Fallback message if no result
          const fallbackMessage: Message = {
            id: `fallback-${Date.now()}`,
            type: 'assistant' as const,
            content: '✅ Task completed successfully!',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }
        
        // Update execution state to completed
        setExecutionState(prev => ({
          ...prev,
          progress: 100,
          currentStep: 'Completed',
          isExecuting: false,
          canCancel: false,
        }));

        toast({
          title: "Execution Complete",
          description: "The code agent has finished processing your request.",
        });
        break;

      case 'raw_message':
        // Log raw messages but don't display them in chat
        console.warn('🚨 [ActiveSession] Received raw message event (should be parsed):', event.data.content);
        break;

      case 'formatting_error':
        console.error('🚨 [ActiveSession] Backend formatting error:', event.data);
        break;

      case 'execution_error':
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `❌ Execution failed: ${event.data.error_message || 'Unknown error occurred'}`,
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
          description: event.data.error_message || 'Unknown error occurred',
          variant: "destructive",
        });
        break;

      default:
        console.log('🤷 [ActiveSession] Unknown SSE event:', event.event_type, event.data);
    }
  };

  const handleCancelExecution = async () => {
    // Cancel the SSE connection first
    if (cancelExecutionRef.current) {
      cancelExecutionRef.current();
      cancelExecutionRef.current = null;
    }

    // If we have an execution ID, try to cancel it on the backend
    if (executionState.executionId) {
      try {
        await codeAgentAPI.cancelExecution(executionState.executionId, 'User cancelled');
        console.log('✅ [ActiveSession] Backend execution cancelled successfully');
      } catch (error) {
        console.error('❌ [ActiveSession] Failed to cancel backend execution:', error);
        // Don't show error to user - cancellation UX should be immediate
      }
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
      content: '🚫 Execution was cancelled by user.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);

    toast({
      title: "Execution Cancelled",
      description: "The execution has been stopped.",
    });
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {session.working_directory.split('/').pop() || 'Code Agent Session'}
              </h1>
              <p className="text-sm text-muted-foreground">{session.working_directory}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Change Dir
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Directory Explorer */}
        <div className="w-80 border-r flex flex-col min-h-0">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Directory
            </h3>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <DirectoryExplorer 
                workingDirectory={session.working_directory} 
                sessionId={session.session_id}
                onFileClick={(filePath) => {
                  // TODO: Handle file click - could open in a code editor
                  console.log('File clicked:', filePath);
                }}
              />
            </div>
            <div className="p-4 border-t flex-shrink-0">
              <Button variant="outline" size="sm" className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Create Snapshot
              </Button>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Execution Progress */}
          {executionState.isExecuting && (
            <div className="flex-shrink-0">
              <ExecutionProgress 
                progress={executionState.progress}
                currentStep={executionState.currentStep}
                onCancel={executionState.canCancel ? handleCancelExecution : undefined}
              />
            </div>
          )}

          {/* Conversation Header */}
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Conversation
            </h3>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
            <div className="p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <ConversationMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t p-4 flex-shrink-0">
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
      </div>
    </div>
  );
}
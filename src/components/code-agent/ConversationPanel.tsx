import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, Loader2 } from 'lucide-react';
import { ConversationMessage } from './ConversationMessage';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    progress: 0,
    currentStep: '',
    canCancel: false,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cancelExecutionRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component mounts or session changes
  useEffect(() => {
    loadChatHistory();
  }, [session.session_id, session.conversation_messages]);

  const loadChatHistory = () => {
    try {
      setIsLoadingHistory(true);
      
      // Use conversation messages from the consolidated agent endpoint
      if (session.conversation_messages && session.conversation_messages.length > 0) {
        // Convert backend messages to frontend format
        const historyMessages: Message[] = session.conversation_messages.map((msg) => ({
          id: msg.message_id,
          type: msg.message_type.toLowerCase() as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));

        // Sort messages by timestamp (oldest first)
        historyMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        setMessages(historyMessages);
      } else {
        // No conversation history available
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast({
        title: "Failed to load chat history",
        description: "Could not retrieve previous messages. Starting with a fresh conversation.",
        variant: "destructive",
      });
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || executionState.isExecuting || isLoadingHistory) return;

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
        session.agent_id,
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
    console.log('🎯 Handling SSE event:', event.event_type, event.data);
    
    switch (event.event_type) {
      case 'execution_init':
        console.log('🚀 Initializing execution:', event.data.execution_id);
        setExecutionState(prev => ({
          ...prev,
          executionId: event.data.execution_id,
          progress: 10,
          currentStep: `Initializing agent in ${event.data.working_directory}...`,
          isExecuting: true,
          canCancel: true,
        }));
        
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
        const success = event.data.success !== false; // Default to true if not specified
        
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
        console.log('🏁 Execution complete event:', event.data);
        console.log('🏁 Extracted result:', result);
        
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

        break;

      case 'raw_message':
        // Log raw messages but don't display them in chat
        console.warn('🚨 Received raw message event (should be parsed):', event.data.content);
        break;

      case 'formatting_error':
        console.error('🚨 Backend formatting error:', event.data);
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
        console.log('🤷 Unknown SSE event:', event.event_type, event.data);
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
        console.log('✅ Backend execution cancelled successfully');
      } catch (error) {
        console.error('❌ Failed to cancel backend execution:', error);
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

  // Auto-height adjustment for textarea (like missions chat)
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 36; // Minimum single line height (reduced)
      const maxHeight = 120; // Maximum height before scrolling
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle input change with auto-height adjustment
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  // Set initial textarea height on mount
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  const examplePrompts = [
    "Add user authentication to this project",
    "Fix any TypeScript errors",
    "Add unit tests for the main components",
    "Implement error handling",
    "Add logging throughout the application",
    "Optimize the database queries",
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Loading indicator - When active */}
      {executionState.isExecuting && (
        <div className="flex-shrink-0 px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm text-gray-600">Processing your request...</span>
            </div>
            {executionState.canCancel && (
              <button
                onClick={handleCancelExecution}
                className="px-3 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-300 hover:border-red-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fixed Conversation Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Conversation
        </h3>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading chat history...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ConversationMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Chat Input Area */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={executionState.isExecuting || isLoadingHistory}
            className="flex-1 min-h-[36px] max-h-[120px] resize-none"
            style={{ height: '36px' }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || executionState.isExecuting || isLoadingHistory}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 transition-all duration-200"
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
  );
}
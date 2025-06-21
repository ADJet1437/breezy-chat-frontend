import { authenticatedFetch } from './authenticatedFetch';
import { buildApiUrl } from './apiConfig';

export interface CodeSession {
  session_id: string;
  user_id: string;
  conversation_id: string;
  working_directory: string;
  status: 'active' | 'idle' | 'executing' | 'terminated' | 'error';
  created_at: string;
  updated_at: string;
  last_activity?: string;
  execution_pattern: string;
  max_iterations: number;
  timeout_seconds: number;
  max_context_tokens: number;
  auto_commit: boolean;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  current_execution_id?: string;
  
  // Legacy compatibility
  id?: string;
  name?: string;
  workingDirectory?: string;
  configuration?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSessionRequest {
  name?: string;
  working_directory: string;
  execution_pattern?: string;
  configuration?: Record<string, any>;
}

export interface ExecutePromptRequest {
  prompt: string;
  execution_pattern?: string;
  timeout_seconds?: number;
  context?: Record<string, any>;
}

export interface ExecutionResponse {
  execution_id: string;
  session_id: string;
  status: string;
  prompt: string;
  started_at: string;
  execution_pattern: string;
  max_iterations: number;
  tool_executions: ToolExecution[];
}

export interface ToolExecution {
  tool_name: string;
  success: boolean;
  execution_time_ms: number;
  input_parameters: Record<string, any>;
  output: Record<string, any>;
  error_message?: string;
  started_at: string;
  completed_at: string;
}

export interface ExecutionStatusResponse {
  execution_id: string;
  session_id: string;
  status: string;
  progress_percentage?: number;
  current_step?: string;
  started_at: string;
  last_update: string;
  completed_steps: number;
  total_steps?: number;
  current_iteration: number;
  recent_tool_executions: ToolExecution[];
}

export interface SSEEvent {
  event_type: string;
  data: Record<string, any>;
}

export interface DirectoryTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified_at?: string;
  is_hidden: boolean;
  extension?: string;
  has_children?: boolean;
  children?: DirectoryTreeItem[];
}

export interface DirectoryTreeResponse {
  session_id: string;
  working_directory: string;
  requested_path?: string;
  resolved_path: string;
  items: DirectoryTreeItem[];
  total_items: number;
  has_more: boolean;
  max_depth_reached: boolean;
  excluded_patterns: string[];
}

class CodeAgentAPI {
  private getApiUrl(path: string): string {
    return buildApiUrl(`/api/v1/code-agent${path}`);
  }

  // Session Management
  async createSession(request: CreateSessionRequest): Promise<CodeSession> {
    const response = await authenticatedFetch(this.getApiUrl('/sessions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  async listSessions(
    limit: number = 50,
    offset: number = 0,
    statusFilter?: string
  ): Promise<{ sessions: CodeSession[]; total: number }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (statusFilter) {
      params.append('status_filter', statusFilter);
    }

    const response = await authenticatedFetch(`${this.getApiUrl('/sessions')}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to list sessions: ${response.statusText}`);
    }

    return response.json();
  }

  async getSession(sessionId: string): Promise<CodeSession> {
    const response = await authenticatedFetch(`${this.getApiUrl(`/sessions/${sessionId}`)}`);

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    return response.json();
  }

  async updateSession(
    sessionId: string,
    updates: Partial<CreateSessionRequest>
  ): Promise<CodeSession> {
    const response = await authenticatedFetch(this.getApiUrl(`/sessions/${sessionId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update session: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await authenticatedFetch(this.getApiUrl(`/sessions/${sessionId}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  // Execution
  executePromptSSE(
    sessionId: string,
    request: ExecutePromptRequest,
    onEvent: (event: SSEEvent) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): () => void {
    // Create a new EventSource for SSE
    const eventSourceUrl = this.getApiUrl(`/sessions/${sessionId}/execute`);
    
    // We need to send the POST request first, then listen to SSE
    // For now, we'll simulate this - in production, you might need to:
    // 1. POST to initiate execution
    // 2. Connect to SSE endpoint with execution ID
    
    // Simulate SSE connection
    let timeoutId: NodeJS.Timeout;
    let cancelled = false;
    
    const simulate = async () => {
      try {
        // Simulate events
        const events: SSEEvent[] = [
          {
            event_type: 'execution_init',
            data: {
              execution_id: `exec-${Date.now()}`,
              session_id: sessionId,
              prompt: request.prompt,
              status: 'initializing'
            }
          },
          {
            event_type: 'execution_progress',
            data: {
              execution_id: `exec-${Date.now()}`,
              progress_percentage: 25,
              current_step: 'Analyzing request',
              message: 'Reading project files...'
            }
          },
          {
            event_type: 'execution_progress',
            data: {
              execution_id: `exec-${Date.now()}`,
              progress_percentage: 50,
              current_step: 'Planning implementation',
              message: 'Generating plan...'
            }
          },
          {
            event_type: 'execution_progress',
            data: {
              execution_id: `exec-${Date.now()}`,
              progress_percentage: 75,
              current_step: 'Executing changes',
              message: 'Modifying files...'
            }
          },
          {
            event_type: 'execution_complete',
            data: {
              execution_id: `exec-${Date.now()}`,
              session_id: sessionId,
              status: 'completed',
              tool_executions: []
            }
          }
        ];

        for (let i = 0; i < events.length; i++) {
          if (cancelled) break;
          
          await new Promise(resolve => {
            timeoutId = setTimeout(resolve, 1000 + Math.random() * 500);
          });
          
          if (!cancelled) {
            onEvent(events[i]);
          }
        }
        
        if (!cancelled) {
          onComplete();
        }
      } catch (error) {
        if (!cancelled) {
          onError(error as Error);
        }
      }
    };

    simulate();

    // Return cleanup function
    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionStatusResponse> {
    const response = await authenticatedFetch(`${this.getApiUrl(`/executions/${executionId}/status`)}`);

    if (!response.ok) {
      throw new Error(`Failed to get execution status: ${response.statusText}`);
    }

    return response.json();
  }

  async cancelExecution(executionId: string, reason?: string): Promise<void> {
    const response = await authenticatedFetch(`${this.getApiUrl(`/executions/${executionId}/cancel`)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: reason || 'User cancelled' }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel execution: ${response.statusText}`);
    }
  }

  // Directory Operations
  async changeDirectory(
    sessionId: string,
    newDirectory: string
  ): Promise<CodeSession> {
    const response = await authenticatedFetch(`${this.getApiUrl(`/sessions/${sessionId}`)}/directory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ working_directory: newDirectory }),
    });

    if (!response.ok) {
      throw new Error(`Failed to change directory: ${response.statusText}`);
    }

    return response.json();
  }

  async getDirectoryInfo(sessionId: string): Promise<any> {
    const response = await authenticatedFetch(`${this.getApiUrl(`/sessions/${sessionId}`)}/directory`);

    if (!response.ok) {
      throw new Error(`Failed to get directory info: ${response.statusText}`);
    }

    return response.json();
  }

  async getDirectoryTree(
    sessionId: string,
    options: {
      path?: string;
      includeHidden?: boolean;
      includeFiles?: boolean;
      includeDirectories?: boolean;
      maxDepth?: number;
    } = {}
  ): Promise<DirectoryTreeResponse> {
    const params = new URLSearchParams();
    
    if (options.path) params.append('path', options.path);
    if (options.includeHidden !== undefined) params.append('include_hidden', options.includeHidden.toString());
    if (options.includeFiles !== undefined) params.append('include_files', options.includeFiles.toString());
    if (options.includeDirectories !== undefined) params.append('include_directories', options.includeDirectories.toString());
    if (options.maxDepth !== undefined) params.append('max_depth', options.maxDepth.toString());

    const url = `${this.getApiUrl(`/sessions/${sessionId}`)}/directory/tree${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get directory tree: ${response.statusText}`);
    }

    return response.json();
  }

  async createSnapshot(
    sessionId: string,
    name?: string,
    description?: string
  ): Promise<any> {
    const response = await authenticatedFetch(`${this.getApiUrl(`/sessions/${sessionId}`)}/snapshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || `Snapshot ${new Date().toISOString()}`,
        description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create snapshot: ${response.statusText}`);
    }

    return response.json();
  }

  // Conversation
  async getConversation(
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
    messageType?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (messageType) {
      params.append('message_type', messageType);
    }

    const response = await authenticatedFetch(
      `${this.getApiUrl(`/sessions/${sessionId}`)}/conversation?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    return response.json();
  }

  // Tools
  async getAvailableTools(): Promise<any> {
    const response = await authenticatedFetch(`${this.getApiUrl('/tools')}`);

    if (!response.ok) {
      throw new Error(`Failed to get available tools: ${response.statusText}`);
    }

    return response.json();
  }

  async getToolInfo(toolName: string): Promise<any> {
    const response = await authenticatedFetch(this.getApiUrl(`/tools/${toolName}`));

    if (!response.ok) {
      throw new Error(`Failed to get tool info: ${response.statusText}`);
    }

    return response.json();
  }

  // Statistics
  async getStatistics(): Promise<any> {
    const response = await authenticatedFetch(`${this.getApiUrl('/statistics')}`);

    if (!response.ok) {
      throw new Error(`Failed to get statistics: ${response.statusText}`);
    }

    return response.json();
  }
}

export const codeAgentAPI = new CodeAgentAPI();
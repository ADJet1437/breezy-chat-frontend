import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Send, Paperclip, Settings, Code, FileText, Trash2, Download, Menu, ExternalLink, Loader2 } from 'lucide-react';
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedGet, authenticatedPost } from '../utils/authenticatedFetch';
import { PaymentRequiredError, handleApiError } from '../utils/errorHandler';
import { buildApiUrl } from '../utils/apiConfig';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import ImageMessage from './chat/ImageMessage';
import ImageGeneratingMessage from './chat/ImageGeneratingMessage';
import ImageEditingMessage from './chat/ImageEditingMessage';
import MissionProgressIndicator, { MissionPhase } from './MissionProgressIndicator';
import SubscriptionDialog from './SubscriptionDialog';
import ChatStickyInputBar, { ChatStickyInputBarRef } from './ChatStickyInputBar';
import FileUpload from './FileUpload';
import { Message } from '../types/chat';
import { BuildPreview } from './code-agent/BuildPreview';
import { ViewModeToggle } from './code-agent/ViewModeToggle';
import { DirectoryPanel } from './code-agent/DirectoryPanel';
import { codeAgentAPI } from '../utils/codeAgentApi';

type ViewMode = 'build' | 'files';

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
    source: string; // "upload" or "generated"
  }[];
  images?: {
    id: string;
    name: string;
    size: number;
    type: string;
    source: string; // "upload" or "generated"
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
  code_agent: {
    id: string | null;
  };
}

interface ChatInterfaceProps {
  missionId?: string;
  rightSidebarVisible?: boolean;
}

interface ProjectData {
  project_id: string;
  project_name: string;
  project_path: string;
  session_id: string;
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
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('init');
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [showRightPanel, setShowRightPanel] = useState(() => {
    // Load from localStorage on initial render for existing missions
    const saved = localStorage.getItem('missionCodeViewOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [viewMode, setViewMode] = useState<ViewMode>('build');
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const projectDataRef = useRef<ProjectData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

  // Handle outside click to close secondary menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSecondaryMenu(false);
      }
    };

    if (showSecondaryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSecondaryMenu]);

  // Save showRightPanel state to localStorage
  useEffect(() => {
    localStorage.setItem('missionCodeViewOpen', JSON.stringify(showRightPanel));
  }, [showRightPanel]);

  // Listen for toggleCodeView custom event from MissionDetail
  useEffect(() => {
    const handleToggleCodeView = () => {
      // Use projectDataRef to get current value for more reliable state access
      const currentProjectData = projectDataRef.current || projectData;
      
      // Always allow toggle if we're in a mission with code agent context
      // The MissionDetail component already checks if hasCodeAgent before showing the button
      setShowRightPanel(prev => !prev);
    };

    const chatElement = document.querySelector('[data-chat-interface]');
    if (chatElement) {
      chatElement.addEventListener('toggleCodeView', handleToggleCodeView);
      return () => {
        chatElement.removeEventListener('toggleCodeView', handleToggleCodeView);
      };
    }
  }, [projectData]);

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
    setIsLoadingHistory(true);
    
    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/missions/${missionId}`));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const missionDetails: MissionDetails = await response.json();

      // Check if mission has a completed code agent and set up project data
      if (missionDetails.code_agent && missionDetails.code_agent.id) {
        const agentId = missionDetails.code_agent.id;
        
        // Set project data for right panel
        const projectInfo = {
          project_id: agentId,
          project_name: missionDetails.name,
          project_path: '', // We don't have this from mission, but not needed for preview
          session_id: agentId // Use agent_id as session_id for compatibility
        };
        
        setProjectData(projectInfo);
        projectDataRef.current = projectInfo;
      }

      // Transform task_messages to Message format
      const historyMessages: Message[] = [];
      
      missionDetails.task_messages.forEach((taskMessage) => {
        // Add user message with only uploaded file attachments (exclude generated files)
        historyMessages.push({
          id: `${taskMessage.id}_user`,
          content: taskMessage.message,
          sender: 'user',
          timestamp: new Date(taskMessage.created_at),
          attachedFiles: taskMessage.files ? taskMessage.files
            .filter(file => file.source === 'upload') // Only show uploaded files in user messages
            .map(file => ({
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
          attachedFiles: taskMessage.files ? taskMessage.files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type
          })) : undefined,
        });

        // Add separate ImageMessage for each image from the images field
        if (taskMessage.images && taskMessage.images.length > 0) {
          taskMessage.images.forEach(image => {
            historyMessages.push({
              id: `${taskMessage.id}_image_${image.id}`,
              content: '',
              sender: 'bot',
              timestamp: new Date(taskMessage.created_at),
              type: 'image',
              imageUrl: buildApiUrl(`/api/v1/files/${image.id}`),
              imageAlt: image.name,
              filename: image.name,
              prompt: taskMessage.message, // Use the original user message as prompt
              isLoaded: true // Mark as loaded for existing images from history
            });
          });
        }
      });

      // Set the messages to the loaded history
      setMessages(historyMessages);
      
    } catch (error) {
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
    
    try {
      // Prepare request payload - include mission_id only if we have one
      const requestPayload: any = {
        message: message,
        llm: 'gpt-4o',
        file_ids: attachedFileIds
      };

      if (effectiveMissionId) {
        requestPayload.mission_id = effectiveMissionId;
      }

      const response = await authenticatedPost(buildApiUrl('/api/v1/missions/complete'), requestPayload);

      // Use handleApiError to properly throw PaymentRequiredError for 402 responses
      await handleApiError(response, 'Chat Message');

      // Create initial bot message with empty content
      const botMessageId = (Date.now() + 1).toString();
      let initialBotMessageCreated = false;
      
      const createInitialBotMessage = () => {
        if (!initialBotMessageCreated) {
          const botMessage: Message = {
            id: botMessageId,
            content: '',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
          initialBotMessageCreated = true;
        }
      };

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; // Buffer to accumulate incomplete JSON

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value);
          buffer += chunk; // Add to buffer
          const lines = buffer.split('\n');
          
          // Keep the last line in buffer (might be incomplete)
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim(); // Remove 'data: ' prefix and trim
                
                // Skip empty data lines
                if (!jsonStr) {
                  continue;
                }
                
                // Skip non-JSON data lines (like system reminders)
                if (!jsonStr.startsWith('{')) {
                  continue;
                }
                
                // Special logging for tool_complete events
                if (jsonStr.includes('tool_complete')) {
                  console.log('🔍 Raw tool_complete JSON (first 500 chars):', jsonStr.substring(0, 500));
                }
                
                const data = JSON.parse(jsonStr);
                console.log('📨 All events:', data.event_type, data.data?.tool_name || '');
                
                if (data.event_type === 'mission_init') {
                  newMissionId = data.answer; // Store for navigation
                  setCurrentMissionId(data.answer);
                  setMissionPhase('init');
                } else if (data.event_type === 'project_created') {
                  const projectInfo = data.data;
                  if (projectInfo && projectInfo.project_id) {
                    const newProjectData = {
                      project_id: projectInfo.project_id,
                      project_name: projectInfo.project_name,
                      project_path: projectInfo.project_path,
                      session_id: projectInfo.session_id
                    };
                    setProjectData(newProjectData);
                    projectDataRef.current = newProjectData; // Store immediately in ref
                    setMissionPhase('project_created');
                    // Force close panel - project is still building
                    setShowRightPanel(false);
                  }
                } else if (data.event_type === 'execution_init') {
                  setMissionPhase('execution');
                  setExecutionProgress(10);
                  setCurrentStep('Starting development...');
                } else if (data.event_type === 'tool_call') {
                  const customMessage = data.data.message || `🔧 Using: ${data.data.tool_name || 'unknown tool'}`;
                  setCurrentStep(customMessage);
                  setExecutionProgress(prev => Math.min(prev + 10, 85));
                } else if (data.event_type === 'tool_start' && data.data?.tool_name === 'image_generation') {
                  // For image generation, create skeleton instead of regular bot message
                  const skeletonMessage: Message = {
                    id: botMessageId, // Use the same ID as the bot message would have used
                    content: data.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'image-generating',
                    prompt: data.data.message.replace('🎨 Generating image: ', '').replace(/\.\.\..*$/, '')
                  };
                  setMessages(prev => [...prev, skeletonMessage]);
                  initialBotMessageCreated = true; // Mark as created to prevent duplicate
                } else if (data.event_type === 'tool_start' && data.data?.tool_name === 'image_editing') {
                  // For image editing, create skeleton instead of regular bot message
                  const skeletonMessage: Message = {
                    id: botMessageId, // Use the same ID as the bot message would have used
                    content: data.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'image-editing',
                    prompt: data.data.message.replace('✏️ Editing image: ', '').replace(/\.\.\..*$/, '')
                  };
                  setMessages(prev => [...prev, skeletonMessage]);
                  initialBotMessageCreated = true; // Mark as created to prevent duplicate
                } else if (data.event_type === 'tool_complete' && data.data?.tool_name === 'image_generation') {
                  console.log('🔧 Image generation complete event received:', data);
                  
                  // Replace skeleton with actual image using the same message ID
                  const result = data.data.result;
                  if (result && result.base64_image) {
                    setMessages(prev => prev.map(msg => 
                      msg.id === botMessageId && msg.type === 'image-generating'
                        ? {
                            ...msg,
                            type: 'image',
                            imageUrl: result.base64_image,
                            imageAlt: result.image_filename,
                            filename: result.image_filename,
                            prompt: result.prompt,
                            isLoaded: true
                          }
                        : msg
                    ));
                  }
                } else if (data.event_type === 'tool_complete' && data.data?.tool_name === 'image_editing') {
                  console.log('🔧 Image editing complete event received:', data);
                  
                  // Replace skeleton with actual edited image using the same message ID
                  const result = data.data.result;
                  if (result && result.base64_image) {
                    setMessages(prev => prev.map(msg => 
                      msg.id === botMessageId && msg.type === 'image-editing'
                        ? {
                            ...msg,
                            type: 'image',
                            imageUrl: result.base64_image,
                            imageAlt: result.image_filename,
                            filename: result.image_filename,
                            prompt: result.prompt,
                            isLoaded: true
                          }
                        : msg
                    ));
                  }
                } else if (data.event_type === 'tool_complete') {
                  console.log('🔧 Tool complete event received:', data);
                  console.log('🔧 Tool name:', data.data?.tool_name);
                  
                  // Handle other tool completions
                } else if (data.event_type === 'execution_reflection') {
                  const message = data.data.message || 'Processing...';
                  setCurrentStep(`💭 ${message}`);
                  setExecutionProgress(prev => Math.min(prev + 5, 90));
                } else if (data.event_type === 'execution_complete') {
                  setMissionPhase('complete');
                  setExecutionProgress(100);
                  setCurrentStep('✅ Mission completed! Launching code agent...');
                  
                  // Auto show right panel with project preview
                  const currentProjectData = projectDataRef.current || projectData;
                  if (currentProjectData?.project_id) {
                    setTimeout(() => {
                      setShowRightPanel(true);
                    }, 1000); // Brief delay for smooth UX
                  }
                } else if (data.event_type === 'mission_content') {
                  // Create bot message if it hasn't been created yet (for non-image-generation flows)
                  createInitialBotMessage();
                  
                  // Update the bot message content by appending the new content
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                      ? { ...msg, content: msg.content + data.answer }
                      : msg
                  ));
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error, 'Line length:', line.length, 'First 200 chars:', line.substring(0, 200));
                if (line.includes('tool_complete')) {
                  console.error('🔍 Failed to parse tool_complete event');
                }
              }
            }
          }
        }
      }
    } catch (error) {
      
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
        navigate(`/missions/${newMissionId}`);
      } else {
        // Focus input after streaming completes so user can immediately type next message
        inputBarRef.current?.focusInput();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

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


  const handleFileClick = (filePath: string) => {
    toast({
      description: `Selected: ${filePath}`,
      duration: 2000,
    });
  };

  const handleCloseRightPanel = () => {
    setShowRightPanel(false);
  };

  const handleSecondaryMenuToggle = () => {
    setShowSecondaryMenu(!showSecondaryMenu);
  };

  const handleSettingsClick = () => {
    setShowSecondaryMenu(false);
    // Settings functionality would be handled by parent component
  };

  const handleCodeViewClick = () => {
    setShowSecondaryMenu(false);
    setShowRightPanel(!showRightPanel);
  };

  const handleDeleteProject = async () => {
    if (!projectData?.project_id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    if (!confirmed) return;

    const effectiveMissionId = missionId || currentMissionId;
    if (!effectiveMissionId) {
      toast({
        title: "Error",
        description: "No mission found to record deletion.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      await codeAgentAPI.deleteAgent(projectData.project_id);
      
      // Add deletion message to chat
      const deletionMessage: Message = {
        id: Date.now().toString(),
        content: `⎿ User deleted project ${projectData.project_id}`,
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, deletionMessage]);
      
      // Save deletion message to task_messages table
      try {
        await authenticatedPost(buildApiUrl(`/api/v1/missions/${effectiveMissionId}/task-messages`), {
          message: `⎿ User deleted project ${projectData.project_id}`,
          answer: "", // Empty answer for system messages
        });
      } catch (messageError) {
        // Don't fail the entire operation if message saving fails
      }
      
      // Close the panel and clear project data
      setShowRightPanel(false);
      setProjectData(null);
      projectDataRef.current = null;
      
      toast({
        title: "Project Deleted",
        description: "The project has been successfully deleted.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDownloadProject = async () => {
    if (!projectData?.project_id) return;
    
    try {
      // Remove the preparing toast to simplify UX

      // Create a custom fetch for binary download to avoid Content-Type issues
      const token = accessToken || localStorage.getItem('talosy_access_token');
      const headers: HeadersInit = {
        'Accept': 'application/zip, application/octet-stream, */*'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        buildApiUrl(`/api/v1/code-agent/agents/${projectData.project_id}/download`),
        {
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${response.status} ${errorText}`);
      }
      
      // Get the blob from response - this preserves binary data
      const blob = await response.blob();
      
      
      // Verify we got a ZIP file
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `tls-project-${projectData.project_id}.zip`;
      
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a brief delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        description: "Success!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the project. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleView = async () => {
    if (!projectData?.project_id) return;

    setIsLoadingPreview(true);
    try {
      const response = await codeAgentAPI.buildAndServeProject(projectData.project_id);
      
      if (response.success && response.preview_url) {
        window.open(response.preview_url, '_blank');
      } else {
        toast({
          title: "Preview Failed",
          description: response.message || 'Failed to build project preview',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to open project preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Show split layout when right panel is open
  if (showRightPanel && projectData?.project_id) {
    return (
      <div className="h-screen w-full max-w-full flex overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-background dark:to-background" data-chat-interface style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Left Side: Mission Chat - 35% */}
        <div className="w-[35%] max-w-[35%] flex flex-col overflow-hidden min-w-0" style={{ width: '35%', maxWidth: '35%', minWidth: '0' }}>
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
            <div className="p-4 min-w-0" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading mission history...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 min-w-0">
                  <MessageList messages={messages} />
                  {isStreaming && missionPhase !== 'init' ? (
                    <MissionProgressIndicator 
                      phase={missionPhase}
                      projectName={projectData?.project_name}
                      currentStep={currentStep}
                      progress={executionProgress}
                    />
                  ) : isStreaming ? (
                    <TypingIndicator />
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Input Bar */}
          <div className="flex-shrink-0 p-4 border-t bg-background">
            <div className="space-y-3">
              {/* Attached Files Display */}
              {attachedFileIds.length > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-chat-attachment-bg rounded-lg border border-blue-200 dark:border-border">
                  <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {attachedFileIds.length} file(s) attached
                  </span>
                  <button
                    onClick={() => {
                      setAttachedFileIds([]);
                      setAttachedFileDetails([]);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm ml-auto"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="flex items-center space-x-3">
                {/* Plus Button */}
                <div className="flex-shrink-0">
                  <FileUpload onFilesUploaded={handleFilesUploaded} />
                </div>

                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isStreaming || isLoadingHistory ? "AI is thinking..." : "Type your message..."}
                    disabled={isStreaming || isLoadingHistory}
                    className="w-full resize-none border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground min-h-[44px] max-h-[120px]"
                    rows={1}
                  />
                </div>

                {/* Send Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isStreaming || isLoadingHistory}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center justify-center h-[44px]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Project Preview - 65% */}
        <div className="w-[65%] max-w-[65%] flex flex-col overflow-hidden min-w-0" style={{ width: '65%', maxWidth: '65%', minWidth: '0' }}>
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-4 py-1.5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                disabled={isLoadingPreview}
              >
                {isLoadingPreview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleDownloadProject}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteProject} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <button
              onClick={handleCloseRightPanel}
              className="p-1 hover:bg-accent rounded-lg transition-colors"
              title="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <BuildPreview agentId={projectData.project_id} />
          </div>
        </div>

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
      </div>
    );
  }

  // Show full-width mission chat view
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-background dark:to-background" data-chat-interface>
      {/* Messages Area with bottom padding for floating input */}
      <div className="flex flex-col h-full pb-24">
        <div className="flex-1 min-h-0 p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <ScrollArea className="flex-1">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading mission history...</p>
                  </div>
                </div>
              ) : (
                <>
                  <MessageList messages={messages} />
                  {isStreaming && missionPhase !== 'init' ? (
                    <MissionProgressIndicator 
                      phase={missionPhase}
                      projectName={projectData?.project_name}
                      currentStep={currentStep}
                      progress={executionProgress}
                    />
                  ) : isStreaming ? (
                    <TypingIndicator />
                  ) : null}
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
    </div>
  );
};

export default ChatInterface;

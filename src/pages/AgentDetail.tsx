import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AgentHeader } from '@/components/code-agent/AgentHeader';
import { DirectoryPanel } from '@/components/code-agent/DirectoryPanel';
import { ConversationPanel } from '@/components/code-agent/ConversationPanel';
import { CodeSession, codeAgentAPI } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // State for session data and loading
  const [session, setSession] = useState<CodeSession | null>(location.state?.session || null);
  const [isLoading, setIsLoading] = useState(!session);

  const handleBackToAgents = () => {
    navigate('/code');
  };

  // Fetch agent data if not available from navigation state
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId) {
        navigate('/code');
        return;
      }

      if (session) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const agentData = await codeAgentAPI.getAgentById(agentId);
        setSession(agentData);
      } catch (error) {
        console.error('Failed to fetch agent data:', error);
        toast({
          title: "Error",
          description: "Failed to load agent data. Redirecting to agent list.",
          variant: "destructive",
        });
        navigate('/code');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId, session, navigate, toast]);

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    );
  }

  // If no session data is available after loading, redirect
  if (!session) {
    navigate('/code');
    return null;
  }

  // Handler functions for various actions
  const handleFileClick = (filePath: string) => {
    // TODO: Handle file click - could open in a code editor
    console.log('File clicked:', filePath);
    toast({
      title: "File Selected",
      description: `Selected: ${filePath}`,
    });
  };

  const handleCreateSnapshot = () => {
    // TODO: Implement snapshot creation
    console.log('Create snapshot requested');
    toast({
      title: "Snapshot",
      description: "Snapshot creation will be implemented soon",
    });
  };


  const handleSettings = () => {
    // TODO: Implement settings
    console.log('Settings requested');
    toast({
      title: "Settings",
      description: "Session settings will be implemented soon",
    });
  };

  const handleDelete = () => {
    // TODO: Implement session deletion
    console.log('Delete session requested');
    toast({
      title: "Delete Session",
      description: "Session deletion will be implemented soon",
      variant: "destructive",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Agent Header */}
      <AgentHeader 
        session={session}
        onBack={handleBackToAgents}
        onSettings={handleSettings}
        onDelete={handleDelete}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Directory Panel */}
        <DirectoryPanel 
          session={session}
          onFileClick={handleFileClick}
          onCreateSnapshot={handleCreateSnapshot}
        />

        {/* Conversation Panel */}
        <ConversationPanel session={session} />
      </div>
    </div>
  );
}
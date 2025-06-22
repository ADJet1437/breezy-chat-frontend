import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AgentHeader } from '@/components/code-agent/AgentHeader';
import { DirectoryPanel } from '@/components/code-agent/DirectoryPanel';
import { ConversationPanel } from '@/components/code-agent/ConversationPanel';
import { CodeSession } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';

export default function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get session data from navigation state
  const session = location.state?.session as CodeSession;

  const handleBackToAgents = () => {
    navigate('/code');
  };

  // If no session data is available, redirect back to agents list
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
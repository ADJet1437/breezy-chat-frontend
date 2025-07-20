import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AgentHeader } from '@/components/code-agent/AgentHeader';
import { ConversationPanel } from '@/components/code-agent/ConversationPanel';
import { RightPanel } from '@/components/code-agent/RightPanel';
import { CodeSession, codeAgentAPI } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // State for session data and loading - always start fresh on page load
  const [session, setSession] = useState<CodeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      // Always fetch fresh data to ensure we have the latest conversation messages

      try {
        setIsLoading(true);
        console.log('🔄 Fetching agent data for ID:', agentId);
        const agentData = await codeAgentAPI.getAgentById(agentId);
        console.log('✅ Received agent data:', agentData);
        setSession(agentData);
      } catch (error) {
        console.error('❌ Failed to fetch agent data:', error);
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
  }, [agentId, navigate, toast]); // Removed session from dependencies

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
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!agentId) return;

    setIsDeleting(true);
    try {
      await codeAgentAPI.deleteAgent(agentId);
      
      toast({
        title: "Agent Deleted",
        description: "The agent and all its data have been permanently deleted.",
        variant: "default",
      });
      
      // Navigate back to agents list
      navigate('/code');
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Fixed Header - Always visible */}
      <div className="flex-shrink-0">
        <AgentHeader 
          session={session}
          onBack={handleBackToAgents}
          onSettings={handleSettings}
          onDelete={handleDelete}
        />
      </div>

      {/* Main Content Area - Split View: Chat (35%) | Build/Files (65%) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Chat Panel - 35% for conversation */}
        <div className="w-[35%] flex flex-col border-r">
          <ConversationPanel session={session} />
        </div>

        {/* Right Side: Build/Files Panel - 65% for app viewing */}
        <div className="w-[65%]">
          <RightPanel 
            session={session}
            onFileClick={handleFileClick}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? This action will permanently delete:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>The agent and all its settings</li>
                <li>All conversations and messages</li>
                <li>All execution sessions and history</li>
                <li>All directory snapshots</li>
              </ul>
              <p className="mt-2 font-medium text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Agent'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
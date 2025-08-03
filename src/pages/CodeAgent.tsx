import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, Code, MoreVertical, Trash2, Bot, MessageSquare } from 'lucide-react';
import { ActiveSession } from '@/components/code-agent/ActiveSession';
import { ProjectList } from '@/components/code-agent/ProjectList';
import { codeAgentAPI, CodeSession, ProjectResponse, SSEEvent } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CodeAgent() {
  const [sessions, setSessions] = useState<CodeSession[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectResponse | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<CodeSession | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Load sessions on component mount - only if authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadSessions();
    }
  }, [authLoading, isAuthenticated]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await codeAgentAPI.listSessions();
      setSessions(response.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // No toast - silent failure
    } finally {
      setIsLoading(false);
    }
  };



  const handleProjectSelect = (project: ProjectResponse) => {
    // Auto-collapse sidebar for better coding experience
    localStorage.setItem('sidebarCollapsed', 'true');
    navigate(`/code/agent/${project.id}`);
  };

  const handleProjectDelete = (project: ProjectResponse) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleSessionDelete = (session: CodeSession) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (projectToDelete) {
        await codeAgentAPI.deleteAgent(projectToDelete.id);
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      } else if (sessionToDelete) {
        await codeAgentAPI.deleteAgent(sessionToDelete.agent_id);
        setSessions(prev => prev.filter(s => s.session_id !== sessionToDelete.session_id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      setSessionToDelete(null);
    }
  };

  const activeSession = sessions.find(s => s.session_id === activeSessionId);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show sign-in required state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Sign in required</h3>
            <p className="text-gray-500 mb-6">Please sign in to start your coding projects</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading code agent...</p>
        </div>
      </div>
    );
  }

  // Main view - show projects and sessions
  return (
    <div className="h-full flex flex-col">
      {/* Projects List */}
      <div className="flex-1 p-6">
        {projects.length === 0 && sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Code className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No code projects yet</h3>
              <p className="text-gray-500 mb-6">Start a new mission to create coding projects</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* New Projects Section */}
            {projects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Projects</h2>
                <ProjectList 
                  projects={projects}
                  onProjectSelect={handleProjectSelect}
                  onProjectDelete={handleProjectDelete}
                />
              </div>
            )}
            
            {/* Legacy Sessions Section */}
            {sessions.length > 0 && (
              <div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-visible p-4">
                  {sessions.map((session) => (
                    <Card 
                      key={session.session_id}
                      className="group cursor-pointer border border-gray-200 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-300 hover:-translate-y-2 hover:z-20 relative transform-gpu"
                      onClick={() => {
                        // Auto-collapse sidebar for better coding experience
                        localStorage.setItem('sidebarCollapsed', 'true');
                        navigate(`/code/agent/${session.agent_id}`, { 
                          state: { session } 
                        });
                      }}
                    >
                      <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-700 transition-colors duration-300">
                            <FolderOpen className="h-5 w-5 group-hover:text-blue-500 transition-colors duration-300" />
                            {session.working_directory.split('/').pop() || 'Agent Session'}
                          </CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50">
                              <DropdownMenuItem 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSessionDelete(session);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.status === 'idle' ? 'bg-green-100 text-green-700' :
                            session.status === 'executing' ? 'bg-blue-100 text-blue-700' :
                            session.status === 'error' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {session.status}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(session.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {projectToDelete ? 'Project' : 'Session'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name || sessionToDelete?.working_directory?.split('/').pop()}"? 
              This action cannot be undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Active session view
  if (activeSession) {
    return (
      <ActiveSession 
        session={activeSession}
        onBack={() => setActiveSessionId(null)}
      />
    );
  }
}
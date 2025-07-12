import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Plus, Bot, Code, Terminal, FileText } from 'lucide-react';
import { SessionCreationModal } from '@/components/code-agent/SessionCreationModal';
import { ActiveSession } from '@/components/code-agent/ActiveSession';
import { ChatBar } from '@/components/code-agent/ChatBar';
import { ProjectList } from '@/components/code-agent/ProjectList';
import { codeAgentAPI, CodeSession, ProjectResponse } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';

export default function CodeAgent() {
  const [sessions, setSessions] = useState<CodeSession[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await codeAgentAPI.listSessions();
      setSessions(response.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (sessionData: { name: string; workingDirectory: string; configuration?: any }) => {
    try {
      const newSession = await codeAgentAPI.createSession({
        name: sessionData.name,
        working_directory: sessionData.workingDirectory,
        configuration: sessionData.configuration,
      });
      
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.session_id);
      setShowCreateModal(false);
      
      toast({
        title: "Success",
        description: "Code session created successfully!",
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = async (description: string) => {
    setIsCreatingProject(true);
    try {
      // Create project using real API
      const newProject = await codeAgentAPI.createProjectFromDescription({ description });
      
      // Add to projects state
      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
      
      // Navigate to the project (using existing agent detail page)
      navigate(`/code/agent/${newProject.id}`);
      
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleProjectSelect = (project: ProjectResponse) => {
    navigate(`/code/agent/${project.id}`);
  };

  const activeSession = sessions.find(s => s.session_id === activeSessionId);

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
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Code Projects</h1>
              <p className="text-muted-foreground">
                {projects.length + sessions.length} projects • Create and manage your coding projects
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Session (Legacy)
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 p-6">
        {projects.length === 0 && sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Welcome to Code Projects</CardTitle>
                <CardDescription className="text-base">
                  Your AI coding assistant that can read, analyze, and modify your codebase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Read and analyze your codebase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span>Make file modifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span>Run commands and tests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span>Implement features step-by-step</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    No projects yet. Create your first project below.
                  </p>
                </div>
              </CardContent>
            </Card>
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
                />
              </div>
            )}
            
            {/* Legacy Sessions Section */}
            {sessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Legacy Sessions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((session) => (
                    <Card 
                      key={session.session_id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/code/agent/${session.agent_id}`, { 
                        state: { session } 
                      })}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FolderOpen className="h-5 w-5" />
                          {session.working_directory.split('/').pop() || 'Agent Session'}
                        </CardTitle>
                        <CardDescription>{session.working_directory}</CardDescription>
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

      {/* Chat Bar for New Projects */}
      <div className="flex-shrink-0 p-6 border-t bg-gray-50">
        <ChatBar 
          onSubmit={handleCreateProject}
          isLoading={isCreatingProject}
          placeholder="What do you want to build? (e.g., 'React e-commerce with authentication')"
        />
      </div>

      {/* Session Creation Modal (keep for backward compatibility) */}
      <SessionCreationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateSession={handleCreateSession}
      />
    </div>
  );

  // Active session view
  if (activeSession) {
    return (
      <ActiveSession 
        session={activeSession}
        onBack={() => setActiveSessionId(null)}
        onCreateNew={() => setShowCreateModal(true)}
      />
    );
  }
}
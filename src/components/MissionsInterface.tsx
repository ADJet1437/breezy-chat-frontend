import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useMissionContext } from '../contexts/MissionContext';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedGet, authenticatedDelete, authenticatedPatch } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Mission {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  llm_id: string;
  system_prompt?: string;
  task_messages: any[];
}

interface MissionsResponse {
  missions: Mission[];
}

const MissionsInterface = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [missionToRename, setMissionToRename] = useState<Mission | null>(null);
  const [newMissionName, setNewMissionName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const { setCurrentMissionId } = useMissionContext();
  const { isLoading: authLoading, isAuthenticated, authFunctionsReady } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch missions when auth is ready and user is authenticated
    // We don't need to wait for authFunctionsReady since authenticatedFetch has localStorage fallback
    if (!authLoading && isAuthenticated) {
      console.log('🚀 Auth ready and user authenticated, fetching missions...');
      fetchMissions();
    } else if (!authLoading && !isAuthenticated) {
      console.log('❌ Auth ready but user not authenticated, skipping missions fetch');
      setIsLoading(false);
    } else {
      console.log('⏳ Waiting for auth to be ready...', { authLoading, isAuthenticated, authFunctionsReady });
    }
  }, [authLoading, isAuthenticated]);

  const fetchMissions = async () => {
    try {
      console.log('🎯 === FETCH MISSIONS CALLED ===');
      console.log('🎯 Auth state:', { authLoading, isAuthenticated, authFunctionsReady });
      setIsLoading(true);
      
      const apiUrl = buildApiUrl('/api/v1/missions');
      console.log('🎯 Making request to:', apiUrl);
      
      const response = await authenticatedGet(apiUrl);
      console.log('🎯 Response received:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MissionsResponse = await response.json();
      console.log('🎯 Missions data received:', data);
      setMissions(data.missions);
    } catch (error) {
      console.error('❌ Error fetching missions:', error);
      toast({
        description: "Failed to load missions. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissionSelect = (missionId: string) => {
    navigate(`/missions/${missionId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteClick = (mission: Mission) => {
    setMissionToDelete(mission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!missionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await authenticatedDelete(buildApiUrl(`/api/v1/missions/${missionToDelete.id}`));
      
      if (!response.ok) {
        throw new Error(`Failed to delete mission: ${response.status}`);
      }

      // Remove mission from local state (optimistic update)
      setMissions(prev => prev.filter(m => m.id !== missionToDelete.id));
      
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast({
        description: "Failed to delete mission. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setMissionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMissionToDelete(null);
  };

  const handleRenameClick = (mission: Mission) => {
    setMissionToRename(mission);
    setNewMissionName(mission.name);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!missionToRename || !newMissionName.trim()) return;

    setIsRenaming(true);
    try {
      const response = await authenticatedPatch(
        buildApiUrl(`/api/v1/missions/${missionToRename.id}`),
        {
          name: newMissionName.trim()
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to rename mission: ${response.status}`);
      }

      const updatedMission = await response.json();
      
      // Update mission in local state (optimistic update)
      setMissions(prev => prev.map(m => 
        m.id === missionToRename.id 
          ? { ...m, name: updatedMission.name, updated_at: updatedMission.updated_at }
          : m
      ));
      
    } catch (error) {
      console.error('Error renaming mission:', error);
      toast({
        description: "Failed to rename mission. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRenaming(false);
      setRenameDialogOpen(false);
      setMissionToRename(null);
      setNewMissionName('');
    }
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setMissionToRename(null);
    setNewMissionName('');
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">
              {authLoading ? 'Authenticating...' : 'Loading missions...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Sign in required</h3>
            <p className="text-gray-500 mb-6">Please sign in to view your missions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Missions List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6">
          {missions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No missions yet</h3>
              <p className="text-gray-500 mb-6">Start a new mission to begin your AI conversation</p>
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-6 py-2"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start First Mission
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-visible p-4">
              {missions.map((mission) => (
                <Card
                  key={mission.id}
                  className="group cursor-pointer border border-gray-200 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-300 hover:-translate-y-2 hover:z-20 relative transform-gpu"
                  onClick={() => handleMissionSelect(mission.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1 pr-2 group-hover:text-blue-700 transition-colors duration-300">
                        {mission.name}
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameClick(mission);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(mission);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      <Calendar className="h-4 w-4 mr-2 group-hover:text-blue-500 transition-colors duration-300" />
                      <span>Created: {formatDate(mission.created_at)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      <Clock className="h-4 w-4 mr-2 group-hover:text-blue-500 transition-colors duration-300" />
                      <span>Updated: {formatDate(mission.updated_at)}</span>
                    </div>
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMissionSelect(mission.id);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Mission
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{missionToDelete?.name}"?
              <br />
              <br />
              This action cannot be undone. All conversation history and files attached to this mission will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Mission'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Mission</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mission-name" className="text-right">
                Name
              </Label>
              <Input
                id="mission-name"
                value={newMissionName}
                onChange={(e) => setNewMissionName(e.target.value)}
                className="col-span-3"
                placeholder="Enter mission name"
                maxLength={200}
                disabled={isRenaming}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRenaming && newMissionName.trim()) {
                    handleRenameConfirm();
                  }
                  if (e.key === 'Escape') {
                    handleRenameCancel();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleRenameCancel}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameConfirm}
              disabled={isRenaming || !newMissionName.trim()}
            >
              {isRenaming ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Renaming...
                </>
              ) : (
                'Rename Mission'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MissionsInterface;

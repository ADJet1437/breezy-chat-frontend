import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, FileText, Calendar, Clock, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authenticatedPost, authenticatedGet, authenticatedPatch, authenticatedDelete } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  file_count: number;
}

interface KnowledgeBasesResponse {
  knowledge_bases: KnowledgeBase[];
}

export function KnowledgeBase() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [knowledgeBaseToEdit, setKnowledgeBaseToEdit] = useState<KnowledgeBase | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  const { toast } = useToast();
  const { isLoading: authLoading, isAuthenticated, authFunctionsReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch knowledge bases when auth is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      console.log('🚀 Auth ready and user authenticated, fetching knowledge bases...');
      fetchKnowledgeBases();
    } else if (!authLoading && !isAuthenticated) {
      console.log('❌ Auth ready but user not authenticated, skipping knowledge bases fetch');
      setIsLoading(false);
    } else {
      console.log('⏳ Waiting for auth to be ready...', { authLoading, isAuthenticated, authFunctionsReady });
    }
  }, [authLoading, isAuthenticated]);

  const fetchKnowledgeBases = async () => {
    try {
      console.log('🎯 === FETCH KNOWLEDGE BASES CALLED ===');
      console.log('🎯 Auth state:', { authLoading, isAuthenticated, authFunctionsReady });
      setIsLoading(true);
      
      const apiUrl = buildApiUrl('/api/v1/knowledge-bases');
      console.log('🎯 Making request to:', apiUrl);
      
      const response = await authenticatedGet(apiUrl);
      console.log('🎯 Response received:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: KnowledgeBasesResponse = await response.json();
      console.log('🎯 Knowledge bases data received:', data);
      setKnowledgeBases(data.knowledge_bases);
    } catch (error) {
      console.error('❌ Error fetching knowledge bases:', error);
      toast({
        description: "Failed to load knowledge bases. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
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

  const handleKnowledgeBaseSelect = (knowledgeBaseId: string) => {
    navigate(`/knowledge-base/${knowledgeBaseId}`);
  };

  const handleDeleteClick = async (knowledgeBase: KnowledgeBase) => {
    try {
      const response = await authenticatedDelete(buildApiUrl(`/api/v1/knowledge-bases/${knowledgeBase.id}`));
      
      if (!response.ok) {
        throw new Error(`Failed to delete knowledge base: ${response.status}`);
      }

      // Remove knowledge base from local state (optimistic update)
      setKnowledgeBases(prev => prev.filter(kb => kb.id !== knowledgeBase.id));
      
      toast({
        description: "Knowledge base deleted successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      toast({
        description: "Failed to delete knowledge base. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleEditClick = (knowledgeBase: KnowledgeBase) => {
    setKnowledgeBaseToEdit(knowledgeBase);
    setEditFormData({
      name: knowledgeBase.name,
      description: knowledgeBase.description || ''
    });
    setEditDialogOpen(true);
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateCancel = () => {
    setCreateDialogOpen(false);
    setFormData({ name: '', description: '' });
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setKnowledgeBaseToEdit(null);
    setEditFormData({ name: '', description: '' });
  };

  const handleEditConfirm = async () => {
    if (!knowledgeBaseToEdit || !editFormData.name.trim()) {
      toast({
        description: "Knowledge base name is required.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsEditing(true);
    try {
      const response = await authenticatedPatch(
        buildApiUrl(`/api/v1/knowledge-bases/${knowledgeBaseToEdit.id}`),
        {
          name: editFormData.name.trim(),
          description: editFormData.description.trim() || null
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update knowledge base: ${response.status}`);
      }

      const updatedKnowledgeBase = await response.json();
      
      // Update knowledge base in local state
      setKnowledgeBases(prev => prev.map(kb => 
        kb.id === knowledgeBaseToEdit.id 
          ? { ...kb, name: updatedKnowledgeBase.name, description: updatedKnowledgeBase.description, updated_at: updatedKnowledgeBase.updated_at }
          : kb
      ));
      
      toast({
        description: "Knowledge base updated successfully!",
        duration: 3000,
      });

      // Close dialog and reset form
      setEditDialogOpen(false);
      setKnowledgeBaseToEdit(null);
      setEditFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      toast({
        description: "Failed to update knowledge base. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleCreateConfirm = async () => {
    if (!formData.name.trim()) {
      toast({
        description: "Knowledge base name is required.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await authenticatedPost(
        buildApiUrl('/api/v1/knowledge-bases'),
        {
          name: formData.name.trim(),
          description: formData.description.trim() || null
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to create knowledge base: ${response.status}`);
      }

      const newKnowledgeBase = await response.json();
      
      // Add new knowledge base to local state (optimistic update)
      setKnowledgeBases(prev => [...prev, {
        ...newKnowledgeBase,
        file_count: 0 // New KB starts with 0 files
      }]);
      
      toast({
        description: "Knowledge base created successfully!",
        duration: 3000,
      });

      // Close dialog and reset form
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      toast({
        description: "Failed to create knowledge base. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">
              {authLoading ? 'Authenticating...' : 'Loading knowledge bases...'}
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
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Sign in required</h3>
            <p className="text-gray-500 mb-6">Please sign in to view your knowledge bases</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Knowledge Bases List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-visible p-4">
            {/* Real Knowledge Base Cards */}
            {knowledgeBases.map((kb) => (
              <Card
                key={kb.id}
                className="group cursor-pointer border border-gray-200 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-300 hover:-translate-y-2 hover:z-20 relative transform-gpu"
                onClick={() => handleKnowledgeBaseSelect(kb.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1 pr-2 group-hover:text-blue-700 transition-colors duration-300">
                      {kb.name}
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
                            handleEditClick(kb);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(kb);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {kb.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {kb.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    <FileText className="h-4 w-4 mr-2 group-hover:text-blue-500 transition-colors duration-300" />
                    <span>{kb.file_count} files</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    <Calendar className="h-4 w-4 mr-2 group-hover:text-blue-500 transition-colors duration-300" />
                    <span>Created: {formatDate(kb.created_at)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    <Clock className="h-4 w-4 mr-2 group-hover:text-blue-500 transition-colors duration-300" />
                    <span>Updated: {formatDate(kb.updated_at)}</span>
                  </div>
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKnowledgeBaseSelect(kb.id);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Knowledge
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Create New Knowledge Base Card */}
            <Card
              className="group cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50/50 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400 hover:-translate-y-2 hover:z-20 relative transform-gpu hover:bg-blue-50/50"
              onClick={handleCreateClick}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-4 group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                      Create Knowledge Base
                    </h3>
                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                      Upload documents to get started
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Create Knowledge Base Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Knowledge Base</DialogTitle>
            <DialogDescription>
              Create a new knowledge base to organize and upload your documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kb-name" className="text-right">
                Name *
              </Label>
              <Input
                id="kb-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter knowledge base name"
                maxLength={200}
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating && formData.name.trim()) {
                    handleCreateConfirm();
                  }
                  if (e.key === 'Escape') {
                    handleCreateCancel();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="kb-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="kb-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter description (optional)"
                maxLength={500}
                disabled={isCreating}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCreateCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateConfirm}
              disabled={isCreating || !formData.name.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Knowledge Base
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Knowledge Base Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Base</DialogTitle>
            <DialogDescription>
              Update the name and description of your knowledge base.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-kb-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-kb-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter knowledge base name"
                maxLength={200}
                disabled={isEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEditing && editFormData.name.trim()) {
                    handleEditConfirm();
                  }
                  if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-kb-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="edit-kb-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter description (optional)"
                maxLength={500}
                disabled={isEditing}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleEditCancel}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditConfirm}
              disabled={isEditing || !editFormData.name.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isEditing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Knowledge Base
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
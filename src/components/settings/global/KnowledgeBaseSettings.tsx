import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Plus, FileText, Calendar, Clock, MoreVertical, Trash2, Edit, Upload, File, CheckCircle, AlertCircle, ExternalLink, ArrowLeft } from 'lucide-react';
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
import { authenticatedPost, authenticatedGet, authenticatedPatch, authenticatedDelete } from '../../../utils/authenticatedFetch';
import { buildApiUrl } from '../../../utils/apiConfig';
import { useAuth } from '../../../contexts/AuthContext';

// Interfaces from original components
interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  file_count: number;
}

interface KnowledgeSource {
  id: string;
  knowledge_base_id: string;
  file_id: string;
  name: string;
  source_type: string;
  file_size?: number;
  mime_type?: string;
  chunk_size: number;
  chunk_overlap: number;
  processing_status: string;
  processing_error?: string;
  processing_started_at?: string;
  processed_at?: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

interface Mission {
  id: string;
  name: string;
  system_prompt?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  llm_id: string;
}

interface KnowledgeBasesResponse {
  knowledge_bases: KnowledgeBase[];
}

type ViewMode = 'list' | 'detail';

export function KnowledgeBaseSettings() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [associatedMissions, setAssociatedMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addToMissionDialogOpen, setAddToMissionDialogOpen] = useState(false);
  const [knowledgeBaseToEdit, setKnowledgeBaseToEdit] = useState<KnowledgeBase | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<KnowledgeSource | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });

  const { toast } = useToast();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchKnowledgeBases();
    }
  }, [authLoading, isAuthenticated]);

  const fetchKnowledgeBases = async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedGet(buildApiUrl('/api/v1/knowledge-bases'));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: KnowledgeBasesResponse = await response.json();
      setKnowledgeBases(data.knowledge_bases);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSources = async (knowledgeBaseId: string) => {
    try {
      setIsLoadingSources(true);
      const response = await authenticatedGet(buildApiUrl(`/api/v1/knowledge-bases/${knowledgeBaseId}/sources`));
      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.status}`);
      }
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setIsLoadingSources(false);
    }
  };

  const fetchAssociatedMissions = async (knowledgeBaseId: string) => {
    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/knowledge-bases/${knowledgeBaseId}/missions`));
      if (!response.ok) {
        throw new Error(`Failed to fetch associated missions: ${response.status}`);
      }
      const data = await response.json();
      setAssociatedMissions(data.missions || []);
    } catch (error) {
      console.error('Error fetching associated missions:', error);
    }
  };

  const fetchUserMissions = async () => {
    try {
      setIsLoadingMissions(true);
      const response = await authenticatedGet(buildApiUrl('/api/v1/missions'));
      if (!response.ok) {
        throw new Error(`Failed to fetch missions: ${response.status}`);
      }
      const data = await response.json();
      setMissions(data.missions || []);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setIsLoadingMissions(false);
    }
  };

  const handleKnowledgeBaseSelect = (knowledgeBase: KnowledgeBase) => {
    setSelectedKnowledgeBase(knowledgeBase);
    setViewMode('detail');
    fetchSources(knowledgeBase.id);
    fetchAssociatedMissions(knowledgeBase.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedKnowledgeBase(null);
    setSources([]);
    setAssociatedMissions([]);
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'failed':
      case 'error':
        return 'Failed';
      default:
        return status;
    }
  };

  // Create handlers - adapted from original components
  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateCancel = () => {
    setCreateDialogOpen(false);
    setFormData({ name: '', description: '' });
  };

  const handleCreateConfirm = async () => {
    if (!formData.name.trim()) {
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
      
      setKnowledgeBases(prev => [...prev, {
        ...newKnowledgeBase,
        file_count: 0
      }]);
      

      setCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating knowledge base:', error);
    } finally {
      setIsCreating(false);
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

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setKnowledgeBaseToEdit(null);
    setEditFormData({ name: '', description: '' });
  };

  const handleEditConfirm = async () => {
    if (!knowledgeBaseToEdit || !editFormData.name.trim()) {
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
      
      setKnowledgeBases(prev => prev.map(kb => 
        kb.id === knowledgeBaseToEdit.id 
          ? { ...kb, name: updatedKnowledgeBase.name, description: updatedKnowledgeBase.description, updated_at: updatedKnowledgeBase.updated_at }
          : kb
      ));

      // Update selected knowledge base if it's the one being edited
      if (selectedKnowledgeBase && selectedKnowledgeBase.id === knowledgeBaseToEdit.id) {
        setSelectedKnowledgeBase({
          ...selectedKnowledgeBase,
          name: updatedKnowledgeBase.name,
          description: updatedKnowledgeBase.description,
          updated_at: updatedKnowledgeBase.updated_at
        });
      }
      

      setEditDialogOpen(false);
      setKnowledgeBaseToEdit(null);
      setEditFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error updating knowledge base:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = async (knowledgeBase: KnowledgeBase) => {
    try {
      const response = await authenticatedDelete(buildApiUrl(`/api/v1/knowledge-bases/${knowledgeBase.id}`));
      
      if (!response.ok) {
        throw new Error(`Failed to delete knowledge base: ${response.status}`);
      }

      setKnowledgeBases(prev => prev.filter(kb => kb.id !== knowledgeBase.id));
      
      // If currently viewing the deleted knowledge base, go back to list
      if (selectedKnowledgeBase && selectedKnowledgeBase.id === knowledgeBase.id) {
        handleBackToList();
      }
      
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
    }
  };

  // File upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const handleFileUpload = async (files: File[]) => {
    if (!selectedKnowledgeBase || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await authenticatedPost(
          buildApiUrl(`/api/v1/knowledge-bases/${selectedKnowledgeBase.id}/sources/upload`),
          formData
        );
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}: ${response.status}`);
        }
      }
      
      fetchSources(selectedKnowledgeBase.id);
      
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSource = async (source: KnowledgeSource) => {
    setSourceToDelete(source);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSource = async () => {
    if (!sourceToDelete || !selectedKnowledgeBase) return;

    try {
      const response = await authenticatedDelete(
        buildApiUrl(`/api/v1/knowledge-bases/${selectedKnowledgeBase.id}/sources/${sourceToDelete.id}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to delete source: ${response.status}`);
      }

      setSources(prev => prev.filter(s => s.id !== sourceToDelete.id));
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  // Mission association handlers
  const handleAddToMission = () => {
    setAddToMissionDialogOpen(true);
    fetchUserMissions();
  };

  const handleAssociateWithMission = async () => {
    if (!selectedMissionId || !selectedKnowledgeBase) return;

    try {
      const response = await authenticatedPost(
        buildApiUrl(`/api/v1/knowledge-bases/${selectedKnowledgeBase.id}/missions`),
        { mission_id: selectedMissionId }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to associate with mission: ${response.status}`);
      }

      await fetchAssociatedMissions(selectedKnowledgeBase.id);
      setAddToMissionDialogOpen(false);
      setSelectedMissionId('');
    } catch (error: any) {
      console.error('Error associating with mission:', error);
    }
  };

  const handleRemoveFromMission = async (missionId: string) => {
    if (!selectedKnowledgeBase) return;

    try {
      const response = await authenticatedDelete(
        buildApiUrl(`/api/v1/knowledge-bases/${selectedKnowledgeBase.id}/missions/${missionId}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to remove from mission: ${response.status}`);
      }


      await fetchAssociatedMissions(selectedKnowledgeBase.id);
    } catch (error) {
      console.error('Error removing from mission:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge bases...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Sign in required</h3>
        <p className="text-gray-500">Please sign in to view your knowledge bases</p>
      </div>
    );
  }

  // Render portals for all dialogs outside of conditional views
  const renderDialogs = () => (
    <>
      {/* Create Knowledge Base Dialog */}
      {createPortal(
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} modal={true}>
          <DialogContent className="sm:max-w-[425px] z-[60]" onOpenAutoFocus={(e) => e.preventDefault()}>
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
                onClick={handleCreateConfirm}
                disabled={isCreating || !formData.name.trim()}
                variant="outline"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
        document.body
      )}

      {/* Edit Knowledge Base Dialog */}
      {createPortal(
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen} modal={true}>
          <DialogContent className="sm:max-w-[425px] z-[60]" onOpenAutoFocus={(e) => e.preventDefault()}>
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
                onClick={handleEditConfirm}
                disabled={isEditing || !editFormData.name.trim()}
                variant="outline"
              >
                {isEditing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
        document.body
      )}

      {/* Delete Source Confirmation Dialog */}
      {createPortal(
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} modal={true}>
          <DialogContent className="sm:max-w-[425px] z-[60]" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete "{sourceToDelete?.name}"?
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline"
                onClick={confirmDeleteSource}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
        document.body
      )}

      {/* Add to Mission Dialog */}
      {createPortal(
        <Dialog open={addToMissionDialogOpen} onOpenChange={setAddToMissionDialogOpen} modal={true}>
          <DialogContent className="sm:max-w-[425px] z-[60]" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="grid gap-4 py-4">
              {isLoadingMissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2 text-gray-600">Loading missions...</span>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No missions found</h3>
                  <p className="text-gray-500">Create a mission first to associate with this knowledge base</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Mission</Label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedMissionId}
                    onChange={(e) => setSelectedMissionId(e.target.value)}
                  >
                    <option value="">Choose a mission...</option>
                    {missions
                      .filter(mission => !associatedMissions.some(am => am.id === mission.id))
                      .map((mission) => (
                        <option key={mission.id} value={mission.id}>
                          {mission.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAssociateWithMission}
                disabled={!selectedMissionId || isLoadingMissions}
                variant="outline"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
        document.body
      )}
    </>
  );

  if (viewMode === 'detail' && selectedKnowledgeBase) {
    return (
      <>
        <ScrollArea className="h-[70vh]">
          <div className="space-y-6 pr-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToList}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(selectedKnowledgeBase)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddToMission}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Mission
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>


          {/* Upload Section */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex items-center justify-center gap-4">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-left">
                    <h3 className="font-medium">
                      {isDragOver ? 'Drop files here' : 'Add more documents'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Drag & drop or click to browse • PDF, DOC, DOCX, TXT, MD, RTF
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                  />
                  <label htmlFor="file-upload">
                    <Button 
                      disabled={isUploading}
                      className="cursor-pointer"
                      variant="outline"
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Browse
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileText className="h-5 w-5" />
              Document ({sources.length})
            </h3>
            
            {isLoadingSources ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg">
                {sources.map((source, index) => (
                  <div
                    key={source.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index !== sources.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-sm truncate text-gray-900">{source.name}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatFileSize(source.file_size)}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(source.processing_status)}
                        <span className="text-xs text-gray-500">{getStatusText(source.processing_status)}</span>
                      </div>
                      {source.processing_error && (
                        <>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-red-600 truncate">Error: {source.processing_error}</span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSource(source)}
                      className="text-gray-400 hover:text-red-600 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated Missions */}
          {associatedMissions.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <BookOpen className="h-5 w-5" />
                Associated Missions ({associatedMissions.length})
              </h3>
              
              <div className="border border-gray-200 rounded-lg">
                {associatedMissions.map((mission, index) => (
                  <div
                    key={mission.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index !== associatedMissions.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <BookOpen className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="font-medium text-sm truncate text-gray-900">{mission.name}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatDate(mission.created_at).split(',')[0]}</span>
                      {mission.system_prompt && (
                        <>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">Has prompt</span>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromMission(mission.id)}
                      className="text-gray-400 hover:text-red-600 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </ScrollArea>
        {renderDialogs()}
      </>
    );
  }

  // List view
  return (
    <>
      <ScrollArea className="h-[70vh]">
        <div className="space-y-6 pr-4">
        <div className="flex items-center justify-end">
          <Button onClick={handleCreateClick} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>

        {knowledgeBases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No knowledge bases yet</h3>
            <p className="text-sm">Create your first knowledge base to get started</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg">
            {knowledgeBases.map((kb, index) => (
              <div
                key={kb.id}
                className={`flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  index !== knowledgeBases.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => handleKnowledgeBaseSelect(kb)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <BookOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{kb.name}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{kb.file_count} files</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatDate(kb.updated_at).split(',')[0]}</span>
                    </div>
                    {kb.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{kb.description}</p>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
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
            ))}
          </div>
        )}

        </div>
      </ScrollArea>
      {renderDialogs()}
    </>
  );
}
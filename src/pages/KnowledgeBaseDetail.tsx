import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ArrowLeft, 
  Upload, 
  Edit,
  Plus,
  File,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authenticatedGet, authenticatedPost, authenticatedPatch, authenticatedDelete } from '../utils/authenticatedFetch';
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

export function KnowledgeBaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [associatedMissions, setAssociatedMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addToMissionDialogOpen, setAddToMissionDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<KnowledgeSource | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchKnowledgeBaseDetail();
      fetchSources();
      fetchAssociatedMissions();
    } else if (!authLoading && !isAuthenticated) {
      navigate('/knowledge-base');
    }
  }, [authLoading, isAuthenticated, id]);

  const fetchKnowledgeBaseDetail = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch knowledge base details
      const kbResponse = await authenticatedGet(buildApiUrl(`/api/v1/knowledge-bases/${id}`));
      if (!kbResponse.ok) {
        throw new Error(`Failed to fetch knowledge base: ${kbResponse.status}`);
      }
      const kbData = await kbResponse.json();
      setKnowledgeBase(kbData);
      setEditFormData({
        name: kbData.name,
        description: kbData.description || ''
      });
      
    } catch (error) {
      console.error('Error fetching knowledge base detail:', error);
      toast({
        description: "Failed to load knowledge base details.",
        variant: "destructive",
        duration: 3000,
      });
      navigate('/knowledge-base');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSources = async () => {
    if (!id) return;
    
    try {
      setIsLoadingSources(true);
      const response = await authenticatedGet(buildApiUrl(`/api/v1/knowledge-bases/${id}/sources`));
      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.status}`);
      }
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        description: "Failed to load knowledge sources.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoadingSources(false);
    }
  };

  const handleDeleteSource = async (source: KnowledgeSource) => {
    setSourceToDelete(source);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSource = async () => {
    if (!sourceToDelete || !id) return;

    try {
      const response = await authenticatedDelete(
        buildApiUrl(`/api/v1/knowledge-bases/${id}/sources/${sourceToDelete.id}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to delete source: ${response.status}`);
      }

      setSources(prev => prev.filter(s => s.id !== sourceToDelete.id));
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
      
      toast({
        description: "Source deleted successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        description: "Failed to delete source. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const handleFileUpload = async (files: File[]) => {
    if (!id || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await authenticatedPost(
          buildApiUrl(`/api/v1/knowledge-bases/${id}/sources/upload`),
          formData
        );
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}: ${response.status}`);
        }
      }
      
      toast({
        description: `Successfully uploaded ${files.length} file(s)! Your knowledge base is being processed.`,
        duration: 4000,
      });
      
      // Refresh sources list
      fetchSources();
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        description: "Failed to upload some files. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditKB = () => {
    setEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    if (knowledgeBase) {
      setEditFormData({
        name: knowledgeBase.name,
        description: knowledgeBase.description || ''
      });
    }
  };

  const handleEditConfirm = async () => {
    if (!knowledgeBase || !editFormData.name.trim()) {
      toast({
        description: "Knowledge base name is required.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await authenticatedPatch(
        buildApiUrl(`/api/v1/knowledge-bases/${knowledgeBase.id}`),
        {
          name: editFormData.name.trim(),
          description: editFormData.description.trim() || null
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update knowledge base: ${response.status}`);
      }

      const updatedKB = await response.json();
      setKnowledgeBase(updatedKB);
      setEditDialogOpen(false);
      
      toast({
        description: "Knowledge base updated successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      toast({
        description: "Failed to update knowledge base. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const fetchAssociatedMissions = async () => {
    if (!id) return;
    
    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/knowledge-bases/${id}/missions`));
      if (!response.ok) {
        throw new Error(`Failed to fetch associated missions: ${response.status}`);
      }
      const data = await response.json();
      setAssociatedMissions(data.missions || []);
    } catch (error) {
      console.error('Error fetching associated missions:', error);
      // Don't show error toast for this as it's not critical
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
      toast({
        description: "Failed to load missions.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoadingMissions(false);
    }
  };

  const handleAddToMission = async () => {
    setAddToMissionDialogOpen(true);
    await fetchUserMissions();
  };

  const handleAssociateWithMission = async () => {
    if (!selectedMissionId || !id) return;

    try {
      const response = await authenticatedPost(
        buildApiUrl(`/api/v1/knowledge-bases/${id}/missions`),
        { mission_id: selectedMissionId }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to associate with mission: ${response.status}`);
      }

      toast({
        description: "Knowledge base successfully associated with mission!",
        duration: 3000,
      });

      // Refresh associated missions and close modal
      await fetchAssociatedMissions();
      setAddToMissionDialogOpen(false);
      setSelectedMissionId('');
    } catch (error: any) {
      console.error('Error associating with mission:', error);
      toast({
        description: error.message || "Failed to associate with mission. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleRemoveFromMission = async (missionId: string) => {
    if (!id) return;

    try {
      const response = await authenticatedDelete(
        buildApiUrl(`/api/v1/knowledge-bases/${id}/missions/${missionId}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to remove from mission: ${response.status}`);
      }

      toast({
        description: "Knowledge base removed from mission successfully!",
        duration: 3000,
      });

      // Refresh associated missions
      await fetchAssociatedMissions();
    } catch (error) {
      console.error('Error removing from mission:', error);
      toast({
        description: "Failed to remove from mission. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleGoToMission = (missionId: string) => {
    navigate(`/missions/${missionId}`);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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


  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading knowledge base...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Knowledge base not found</h3>
            <Button onClick={() => navigate('/knowledge-base')} variant="outline">
              Back to Knowledge Bases
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/knowledge-base')}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEditKB}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Knowledge Base
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddToMission}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Mission
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Knowledge Base Info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{knowledgeBase.name}</h1>
        {knowledgeBase.description && (
          <p className="text-gray-600">{knowledgeBase.description}</p>
        )}
      </div>

      {/* Compact Upload Section */}
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

      {/* Knowledge Sources */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Knowledge Sources ({sources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSources ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">Loading sources...</span>
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No sources yet</h3>
              <p className="text-gray-500">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{source.name}</h4>
                        {getStatusIcon(source.processing_status)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(source.processing_status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatFileSize(source.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(source.created_at)}</span>
                        {source.chunk_count > 0 && (
                          <>
                            <span>•</span>
                            <span>{source.chunk_count} chunks</span>
                          </>
                        )}
                      </div>
                      {source.processing_error && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {source.processing_error}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSource(source)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Associated Missions */}
      {associatedMissions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Associated Missions ({associatedMissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {associatedMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleGoToMission(mission.id)}
                  >
                    <BookOpen className="h-8 w-8 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{mission.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Associated on {formatDate(mission.created_at)}</span>
                        {mission.system_prompt && (
                          <>
                            <span>•</span>
                            <span>Has system prompt</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleGoToMission(mission.id)}
                        className="cursor-pointer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Go to Mission
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveFromMission(mission.id)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove from Knowledge Base
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add to Mission Dialog */}
      <Dialog open={addToMissionDialogOpen} onOpenChange={setAddToMissionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add to Mission</DialogTitle>
            <DialogDescription>
              Select a mission to associate this knowledge base with.
            </DialogDescription>
          </DialogHeader>
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
              variant="outline" 
              onClick={() => {
                setAddToMissionDialogOpen(false);
                setSelectedMissionId('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssociateWithMission}
              disabled={!selectedMissionId || isLoadingMissions}
            >
              Associate
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
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter knowledge base name"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter description (optional)"
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditConfirm}
              disabled={!editFormData.name.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Source Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Source</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sourceToDelete?.name}"? This action cannot be undone and will remove all associated embeddings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setSourceToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteSource}
            >
              Delete Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
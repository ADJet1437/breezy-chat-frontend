import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, File, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authenticatedDelete, authenticatedGet } from '../../../utils/authenticatedFetch';
import { buildApiUrl } from '../../../utils/apiConfig';
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

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at?: string;
}

interface FilesSettingsProps {
  missionId: string;
}

const FilesSettings: React.FC<FilesSettingsProps> = ({ missionId }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMissionFiles();
  }, [missionId]);

  const loadMissionFiles = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/missions/${missionId}`));
      if (response.ok) {
        const missionData = await response.json();
        // Extract files from task_messages
        const allFiles: FileInfo[] = [];
        if (missionData.task_messages) {
          missionData.task_messages.forEach((message: any) => {
            if (message.files) {
              message.files.forEach((file: any) => {
                // Avoid duplicates
                if (!allFiles.find(f => f.id === file.id)) {
                  allFiles.push({
                    id: file.id,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    created_at: message.created_at,
                  });
                }
              });
            }
          });
        }
        setFiles(allFiles);
      }
    } catch (error) {
      console.error('Error loading mission files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mission files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (type.startsWith('text/') || type.includes('document')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteClick = (file: FileInfo) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setIsDeletingFile(true);
    try {
      const response = await authenticatedDelete(buildApiUrl(`/api/v1/files/${fileToDelete.id}`));
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
        toast({
          title: 'File deleted',
          description: `${fileToDelete.name} has been deleted successfully.`,
        });
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingFile(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-accent/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border bg-accent/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No files attached</p>
              <p className="text-xs text-muted-foreground">
                Files will appear here when you upload them in your conversations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-3">
                {files.length} file{files.length !== 1 ? 's' : ''} attached to this mission
              </div>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(file)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title={`Delete ${file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete File
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeletingFile}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingFile ? 'Deleting...' : 'Delete File'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FilesSettings;
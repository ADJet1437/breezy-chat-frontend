import React, { useState, useRef } from 'react';
import { Plus, X, File, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authenticatedPost } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

interface FileUploadProps {
  onFilesUploaded: (fileIds: string[], fileDetails: UploadedFile[]) => void;
  disabled?: boolean;
  missionId?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, disabled, missionId }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('text/')) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word')) return '📘';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  };

  const validateFile = (file: File): string | null => {
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    // Check file type (allow common document and image types)
    const allowedTypes = [
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/pdf',
      'application/json',
      'application/xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type) && !file.type.startsWith('text/')) {
      return 'File type not supported';
    }

    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        description: errors.join('\n'),
        variant: "destructive",
        duration: 5000,
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add mission_id if available
      if (missionId) {
        formData.append('mission_id', missionId);
      }

      const response = await authenticatedPost(buildApiUrl('/api/v1/files/upload'), formData);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        id: result.file.id,
        name: result.file.name,
        size: result.file.size || file.size,
        type: result.file.mime_type || file.type,
      };
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const uploaded: UploadedFile[] = [];
    const failed: string[] = [];

    for (const file of selectedFiles) {
      const result = await uploadFile(file);
      if (result) {
        uploaded.push(result);
      } else {
        failed.push(file.name);
      }
    }

    if (failed.length > 0) {
      toast({
        description: `Failed to upload: ${failed.join(', ')}`,
        variant: "destructive",
        duration: 5000,
      });
    }

    if (uploaded.length > 0) {
      setUploadedFiles(prev => [...prev, ...uploaded]);
      toast({
        description: `Successfully uploaded ${uploaded.length} file(s)`,
        duration: 3000,
      });
    }

    setSelectedFiles([]);
    setIsUploading(false);
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleAttachFiles = () => {
    if (uploadedFiles.length === 0) {
      toast({
        description: "Please upload files first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const fileIds = uploadedFiles.map(file => file.id);
    onFilesUploaded(fileIds, uploadedFiles);
    
    // Reset state
    setUploadedFiles([]);
    setSelectedFiles([]);
    setShowDialog(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <>
      {/* Plus Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={disabled}
        className="p-2 h-10 w-10 rounded-xl border-gray-300 hover:border-blue-500 hover:bg-blue-50"
        title="Attach files"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* File Upload Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Attach Files</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* File Drop Zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports: Documents, Images, Text files (Max 10MB each)
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <File className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.xml,.md,.jpg,.jpeg,.png,.gif,.webp"
              />
            </div>

            {/* Selected Files (Not yet uploaded) */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Selected Files</h3>
                  <Button
                    onClick={handleUploadFiles}
                    disabled={isUploading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelectedFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Uploaded Files</h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        <span className="text-green-600 text-sm font-medium">✓ Uploaded</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setSelectedFiles([]);
                setUploadedFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAttachFiles}
              disabled={uploadedFiles.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Attach {uploadedFiles.length} File(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileUpload;
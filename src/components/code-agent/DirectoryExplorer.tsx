import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { codeAgentAPI, DirectoryTreeItem } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  hasChildren?: boolean;
  size?: number;
  extension?: string;
}

interface DirectoryExplorerProps {
  workingDirectory: string;
  sessionId: string;
  onFileClick?: (filePath: string) => void;
}

export function DirectoryExplorer({ workingDirectory, sessionId, onFileClick }: DirectoryExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load root directory on mount
  useEffect(() => {
    loadDirectoryTree();
  }, [sessionId]);

  const loadDirectoryTree = async (path?: string) => {
    try {
      setIsLoading(true);
      const response = await codeAgentAPI.getDirectoryTree(sessionId, {
        path,
        includeHidden: false,
        includeFiles: true,
        includeDirectories: true,
        maxDepth: 1,
      });

      if (!path) {
        // Loading root directory
        const rootNode: FileNode = {
          name: workingDirectory.split('/').pop() || 'project-root',
          type: 'directory',
          path: '',
          isExpanded: true,
          children: response.items.map(convertToFileNode),
        };
        setFileTree(rootNode);
      } else {
        // Loading children for a specific directory - update the tree
        setFileTree((prev) => prev ? updateNodeChildren(prev, path, response.items.map(convertToFileNode)) : null);
      }
    } catch (error) {
      console.error('Failed to load directory tree:', error);
      toast({
        title: "Error",
        description: "Failed to load directory structure",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertToFileNode = (item: DirectoryTreeItem): FileNode => {
    return {
      name: item.name,
      type: item.type,
      path: item.path,
      hasChildren: item.has_children,
      size: item.size,
      extension: item.extension,
      isExpanded: false,
      children: undefined, // Will be loaded lazily
    };
  };

  const updateNodeChildren = (node: FileNode, targetPath: string, children: FileNode[]): FileNode => {
    if (node.path === targetPath) {
      return { ...node, children, isLoading: false };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => updateNodeChildren(child, targetPath, children)),
      };
    }
    return node;
  };

  const toggleExpanded = async (path: string) => {
    const findNode = (node: FileNode, targetPath: string): FileNode | null => {
      if (node.path === targetPath) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    if (!fileTree) return;

    const targetNode = findNode(fileTree, path);
    if (!targetNode || targetNode.type !== 'directory') return;

    // If already expanded, just collapse it
    if (targetNode.isExpanded) {
      const updateNode = (node: FileNode): FileNode => {
        if (node.path === path) {
          return { ...node, isExpanded: false };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        }
        return node;
      };
      setFileTree(updateNode(fileTree));
      return;
    }

    // If not expanded and has no children loaded yet, load them
    if (!targetNode.children && targetNode.hasChildren) {
      // Mark as loading
      const updateNode = (node: FileNode): FileNode => {
        if (node.path === path) {
          return { ...node, isLoading: true, isExpanded: true };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        }
        return node;
      };
      setFileTree(updateNode(fileTree));

      // Load children
      await loadDirectoryTree(path);
    } else {
      // Just expand if children already loaded
      const updateNode = (node: FileNode): FileNode => {
        if (node.path === path) {
          return { ...node, isExpanded: true };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        }
        return node;
      };
      setFileTree(updateNode(fileTree));
    }
  };

  const getFileIcon = (name: string, type: 'file' | 'directory') => {
    if (type === 'directory') {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }

    const extension = name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'py':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'md':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'json':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'txt':
      case 'env':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 py-1 px-2 hover:bg-accent rounded-sm cursor-pointer`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleExpanded(node.path);
            } else if (onFileClick) {
              onFileClick(node.path);
            }
          }}
        >
          {node.type === 'directory' && (
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
              {node.isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {node.type === 'file' && <div className="w-4" />} {/* Spacer for files */}
          {getFileIcon(node.name, node.type)}
          <span className="text-sm truncate flex-1">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>
        
        {node.type === 'directory' && node.isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading && !fileTree) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading directory...</p>
        </div>
      </div>
    );
  }

  if (!fileTree) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No directory data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      {renderNode(fileTree)}
    </div>
  );
}
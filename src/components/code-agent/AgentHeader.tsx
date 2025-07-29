import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Menu, 
  Trash2,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { CodeSession, codeAgentAPI } from '@/utils/codeAgentApi';
import { useToast } from '@/hooks/use-toast';

interface AgentHeaderProps {
  session: CodeSession;
  onBack: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function AgentHeader({ 
  session, 
  onBack, 
  onDelete,
  onDownload 
}: AgentHeaderProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { toast } = useToast();

  const handleView = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await codeAgentAPI.buildAndServeProject(session.agent_id);
      
      if (response.success && response.preview_url) {
        window.open(response.preview_url, '_blank');
      } else {
        toast({
          title: "Preview Failed",
          description: response.message || 'Failed to build project preview',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to get preview URL:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to open project preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="border-b p-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {session.working_directory.split('/').pop() || 'Code Agent Session'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            disabled={isLoadingPreview}
          >
            {isLoadingPreview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
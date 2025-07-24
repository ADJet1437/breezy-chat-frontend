import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Settings, 
  Trash2,
  FolderOpen,
  FileText,
  Hammer
} from 'lucide-react';
import { CodeSession } from '@/utils/codeAgentApi';

interface AgentHeaderProps {
  session: CodeSession;
  onBack: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
  onFilesView?: () => void;
  onBuildView?: () => void;
}

export function AgentHeader({ 
  session, 
  onBack, 
  onSettings, 
  onDelete,
  onFilesView,
  onBuildView 
}: AgentHeaderProps) {
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onBuildView && (
                <DropdownMenuItem onClick={onBuildView}>
                  <Hammer className="h-4 w-4 mr-2" />
                  Build
                </DropdownMenuItem>
              )}
              {onFilesView && (
                <DropdownMenuItem onClick={onFilesView}>
                  <FileText className="h-4 w-4 mr-2" />
                  Files
                </DropdownMenuItem>
              )}
              {onSettings && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  Plus, 
  FolderOpen
} from 'lucide-react';
import { CodeSession } from '@/utils/codeAgentApi';

interface AgentHeaderProps {
  session: CodeSession;
  onBack: () => void;
  onCreateNew: () => void;
  onChangeDirectory?: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
}

export function AgentHeader({ 
  session, 
  onBack, 
  onCreateNew, 
  onChangeDirectory, 
  onSettings, 
  onDelete 
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
            <p className="text-sm text-muted-foreground">{session.working_directory}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onChangeDirectory}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Change Dir
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCreateNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { FolderOpen } from 'lucide-react';
import { DirectoryExplorer } from './DirectoryExplorer';
import { CodeSession } from '@/utils/codeAgentApi';

interface DirectoryPanelProps {
  session: CodeSession;
  onFileClick?: (filePath: string) => void;
}

export function DirectoryPanel({ 
  session, 
  onFileClick 
}: DirectoryPanelProps) {
  return (
    <div className="w-80 border-r flex flex-col overflow-hidden">
      {/* Fixed Directory Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Directory
        </h3>
      </div>

      {/* Scrollable Directory Tree */}
      <div className="flex-1 overflow-y-auto">
        <DirectoryExplorer 
          workingDirectory={session.working_directory} 
          sessionId={session.session_id}
          onFileClick={onFileClick}
        />
      </div>

    </div>
  );
}
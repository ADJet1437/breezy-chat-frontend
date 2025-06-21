import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen, Camera } from 'lucide-react';
import { DirectoryExplorer } from './DirectoryExplorer';
import { CodeSession } from '@/utils/codeAgentApi';

interface DirectoryPanelProps {
  session: CodeSession;
  onFileClick?: (filePath: string) => void;
  onCreateSnapshot?: () => void;
}

export function DirectoryPanel({ 
  session, 
  onFileClick, 
  onCreateSnapshot 
}: DirectoryPanelProps) {
  return (
    <>
      {/* Directory Area with bottom padding for sticky button */}
      <div className="w-80 border-r flex flex-col h-full pb-20">
        {/* Directory Header - Fixed */}
        <div className="p-4 border-b flex-shrink-0">
          <h3 className="font-medium flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Directory
          </h3>
        </div>

        {/* Directory Tree - Scrollable */}
        <div className="flex-1 min-h-0">
          <DirectoryExplorer 
            workingDirectory={session.working_directory} 
            sessionId={session.session_id}
            onFileClick={onFileClick}
          />
        </div>
      </div>

      {/* Fixed Create Snapshot Button */}
      <div className="fixed bottom-0 left-64 w-80 bg-white border-t border-r z-40">
        <div className="p-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onCreateSnapshot}
          >
            <Camera className="h-4 w-4 mr-2" />
            Create Snapshot
          </Button>
        </div>
      </div>
    </>
  );
}
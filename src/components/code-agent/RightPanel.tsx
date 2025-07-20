import React, { useState } from 'react';
import { ViewModeToggle } from './ViewModeToggle';
import { BuildPreview } from './BuildPreview';
import { DirectoryPanel } from './DirectoryPanel';
import { CodeSession } from '@/utils/codeAgentApi';

type ViewMode = 'build' | 'files';

interface RightPanelProps {
  session: CodeSession;
  onFileClick: (filePath: string) => void;
}

export function RightPanel({ session, onFileClick }: RightPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('build');

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Toggle Header - Minimal padding for more content space */}
      <div className="flex items-center justify-end px-3 py-2 border-b bg-muted/30 flex-shrink-0">
        <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {/* Content Area - Takes remaining height */}
      <div className="flex-1 min-h-0">
        {viewMode === 'build' ? (
          <BuildPreview agentId={session.agent_id} />
        ) : (
          <div className="h-full flex">
            <DirectoryPanel 
              session={session}
              onFileClick={onFileClick}
            />
            
            {/* File Content Area - TODO: Implement file viewer */}
            <div className="flex-1 p-4 border-l">
              <div className="text-center text-muted-foreground">
                <p>Click a file to view its contents</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
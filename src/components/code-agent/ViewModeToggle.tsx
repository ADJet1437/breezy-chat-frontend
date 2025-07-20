import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, FileText } from 'lucide-react';

type ViewMode = 'build' | 'files';

interface ViewModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={mode === 'build' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('build')}
        className="h-8"
      >
        <Play className="h-4 w-4 mr-2" />
        Build
      </Button>
      <Button
        variant={mode === 'files' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('files')}
        className="h-8"
      >
        <FileText className="h-4 w-4 mr-2" />
        Files
      </Button>
    </div>
  );
}
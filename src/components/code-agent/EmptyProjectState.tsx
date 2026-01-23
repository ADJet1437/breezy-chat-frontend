import React from 'react';
import { Loader2, Code2 } from 'lucide-react';

export function EmptyProjectState() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Code2 className="h-16 w-16 mx-auto text-muted-foreground/50 animate-pulse" />
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground animate-pulse">
            Building your project
          </h3>
          <p className="text-sm text-muted-foreground">
            Your code project will appear here once it's ready
          </p>
        </div>
      </div>
    </div>
  );
}


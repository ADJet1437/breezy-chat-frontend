import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { codeAgentAPI } from '@/utils/codeAgentApi';

interface BuildPreviewProps {
  agentId: string;
  refreshTrigger?: number;
}

export function BuildPreview({ agentId, refreshTrigger }: BuildPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buildProject = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to check if build already exists first (simple optimization)
        // If this fails, we'll fall back to building
        const response = await codeAgentAPI.buildAndServeProject(agentId);
        
        if (response.success && response.preview_url) {
          setPreviewUrl(response.preview_url);
        } else {
          setError(response.message || 'Build failed');
        }
      } catch (error) {
        console.error('Build failed:', error);
        setError(error instanceof Error ? error.message : 'Build failed');
      } finally {
        setIsLoading(false);
      }
    };

    buildProject();
  }, [agentId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Building project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-medium mb-2">Build Failed</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <iframe
        src={previewUrl}
        className="w-full h-full border-0"
        title="Project Preview"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    );
  }

  return null;
}
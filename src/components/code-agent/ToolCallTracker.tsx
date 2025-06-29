import React from 'react';
import { Check, Loader2, X, Clock } from 'lucide-react';

export interface ToolCall {
  id: string;
  name: string;
  status: 'executing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  executionTimeMs?: number;
  message?: string;
  error?: string;
}

interface ToolCallTrackerProps {
  toolCalls: ToolCall[];
  className?: string;
}

export function ToolCallTracker({ toolCalls, className = '' }: ToolCallTrackerProps) {
  if (toolCalls.length === 0) return null;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusIcon = (status: ToolCall['status']) => {
    switch (status) {
      case 'executing':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <X className="h-3 w-3 text-red-500" />;
    }
  };

  const getStatusText = (tool: ToolCall) => {
    switch (tool.status) {
      case 'executing':
        return 'executing...';
      case 'completed':
        return tool.executionTimeMs ? `(${formatDuration(tool.executionTimeMs)})` : '';
      case 'failed':
        return tool.error ? `failed: ${tool.error}` : 'failed';
    }
  };

  const getStatusColor = (status: ToolCall['status']) => {
    switch (status) {
      case 'executing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {toolCalls.map((tool) => (
        <div key={tool.id} className="flex items-center gap-2 text-sm">
          {getStatusIcon(tool.status)}
          <span className="font-medium text-gray-700">{tool.name}</span>
          <span className={`text-xs ${getStatusColor(tool.status)}`}>
            {getStatusText(tool)}
          </span>
        </div>
      ))}
    </div>
  );
}
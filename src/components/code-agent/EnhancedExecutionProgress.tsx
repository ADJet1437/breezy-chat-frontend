import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Loader2, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { ToolCallTracker, ToolCall } from './ToolCallTracker';
import { useState } from 'react';

interface EnhancedExecutionProgressProps {
  progress: number;
  currentStep: string;
  toolCalls: ToolCall[];
  onCancel?: () => void;
}

export function EnhancedExecutionProgress({ 
  progress, 
  currentStep, 
  toolCalls, 
  onCancel 
}: EnhancedExecutionProgressProps) {
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  
  const completedTools = toolCalls.filter(t => t.status === 'completed').length;
  const totalTools = toolCalls.length;
  const hasTools = toolCalls.length > 0;

  return (
    <Card className="mx-4 mt-4 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="font-medium text-blue-900">
              Executing your request...
            </span>
          </div>
          {onCancel && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <Wrench className="h-3 w-3" />
              <span>{currentStep}</span>
            </div>
            <span className="text-blue-600 font-medium">{Math.round(progress)}%</span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2 bg-blue-200" 
          />

          {/* Tool Calls Section */}
          {hasTools && (
            <div className="border-t border-blue-200 pt-3">
              <button
                onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-blue-800 hover:text-blue-900 w-full text-left"
              >
                {isToolsExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span>
                  Tool Execution {totalTools > 0 && `(${completedTools}/${totalTools})`}
                </span>
              </button>
              
              {isToolsExpanded && (
                <div className="mt-2 pl-5">
                  <ToolCallTracker toolCalls={toolCalls} />
                </div>
              )}
            </div>
          )}
        </div>

        {onCancel && (
          <div className="mt-3 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Cancel Execution
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
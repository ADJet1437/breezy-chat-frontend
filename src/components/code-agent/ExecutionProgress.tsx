import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Loader2, Wrench } from 'lucide-react';

interface ExecutionProgressProps {
  progress: number;
  currentStep: string;
  onCancel?: () => void;
}

export function ExecutionProgress({ progress, currentStep, onCancel }: ExecutionProgressProps) {
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

        <div className="space-y-2">
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
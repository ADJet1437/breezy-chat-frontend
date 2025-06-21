import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';

interface SessionCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSession: (sessionData: { name: string; workingDirectory: string; configuration?: any }) => void;
}

export function SessionCreationModal({ open, onOpenChange, onCreateSession }: SessionCreationModalProps) {
  const [sessionName, setSessionName] = useState('');
  const [workingDirectory, setWorkingDirectory] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxIterations, setMaxIterations] = useState('10');
  const [timeout, setTimeout] = useState('300');
  const [executionPattern, setExecutionPattern] = useState('planner');
  const [isCreating, setIsCreating] = useState(false);


  const handleCreate = async () => {
    if (!workingDirectory) {
      return;
    }

    setIsCreating(true);
    try {
      const configuration = showAdvanced ? {
        max_iterations: parseInt(maxIterations),
        timeout_seconds: parseInt(timeout),
        execution_pattern: executionPattern,
      } : {};

      await onCreateSession({
        name: sessionName || 'New Session',
        workingDirectory,
        configuration,
      });

      // Reset form
      setSessionName('');
      setWorkingDirectory('');
      setShowAdvanced(false);
      setMaxIterations('10');
      setTimeout('300');
      setExecutionPattern('planner');
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Code Session</DialogTitle>
          <DialogDescription>
            Set up a new coding session with your project directory
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Working Directory */}
          <div className="space-y-2">
            <Label htmlFor="directory">Working Directory *</Label>
            <Input
              id="directory"
              value={workingDirectory}
              onChange={(e) => setWorkingDirectory(e.target.value)}
              placeholder="/Users/username/path/to/your/project"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Enter the full absolute path to your project directory
            </p>
          </div>

          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Session Name</Label>
            <Input
              id="name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="My Project Session"
            />
            <p className="text-sm text-muted-foreground">
              Optional - will use directory name if not provided
            </p>
          </div>

          {/* Advanced Configuration */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Settings className="h-4 w-4" />
                Advanced Configuration
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iterations">Max Iterations</Label>
                  <Input
                    id="iterations"
                    type="number"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(e.target.value)}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(e.target.value)}
                    min="60"
                    max="1800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pattern">Execution Pattern</Label>
                <Select value={executionPattern} onValueChange={setExecutionPattern}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planner">Planner Mode (Recommended)</SelectItem>
                    <SelectItem value="direct">Direct Execution</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Planner mode breaks down tasks into steps for better results
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!workingDirectory || isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
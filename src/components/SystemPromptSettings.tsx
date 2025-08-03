import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticatedPatch } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemPromptSettingsProps {
  missionId: string;
  systemPrompt?: string;
  onSystemPromptUpdate: (newPrompt: string) => void;
}

const SystemPromptSettings: React.FC<SystemPromptSettingsProps> = ({
  missionId,
  systemPrompt = '',
  onSystemPromptUpdate,
}) => {
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(systemPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentSystemPrompt(systemPrompt);
    setHasChanges(false);
  }, [systemPrompt]);

  useEffect(() => {
    setHasChanges(currentSystemPrompt !== systemPrompt);
  }, [currentSystemPrompt, systemPrompt]);

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsLoading(true);
    try {
      const response = await authenticatedPatch(
        buildApiUrl(`/api/v1/missions/${missionId}`),
        {
          system_prompt: currentSystemPrompt,
        }
      );

      if (response.ok) {
        const data = await response.json();
        onSystemPromptUpdate(data.system_prompt || '');
        toast({
          title: 'System prompt updated',
          description: 'The system prompt has been saved successfully.',
        });
        setHasChanges(false);
      } else {
        throw new Error('Failed to update system prompt');
      }
    } catch (error) {
      console.error('Error updating system prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to update system prompt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentSystemPrompt(systemPrompt);
    setHasChanges(false);
  };

  return (
    <Card className="border-border bg-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">System Prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="system-prompt" className="text-sm">
            Custom instructions for this mission
          </Label>
          <Textarea
            id="system-prompt"
            value={currentSystemPrompt}
            onChange={(e) => setCurrentSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant specialized in software development. You always respond with clear explanations and provide practical code examples when needed."
            className="min-h-[200px] resize-none bg-accent/20 border-border placeholder:text-muted-foreground"
            maxLength={2000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {currentSystemPrompt.length}/2000
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Define the AI's role and expertise</li>
            <li>Specify response format preferences</li>
            <li>Set tone and communication style</li>
            <li>Add domain-specific instructions</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          
          {hasChanges && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="w-full border-border hover:bg-accent"
            >
              Reset Changes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemPromptSettings;
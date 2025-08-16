import React, { useState, useEffect } from 'react';
import { Bot, AlertCircle, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiModelsService, AIModel } from '../../../services/aiModelsService';
import { useMissionContext } from '../../../contexts/MissionContext';
import { authenticatedFetch } from '../../../utils/authenticatedFetch';
import { buildApiUrl } from '../../../utils/apiConfig';

const AIModelSettings: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentMissionId, currentMissionLlmId, setMissionData } = useMissionContext();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedModels = await aiModelsService.getAIModels();
        setModels(fetchedModels);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load AI models';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [toast]);

  // Determine current model logic
  const getCurrentModel = () => {
    if (!models.length) return null;
    
    if (currentMissionLlmId) {
      // Mission has explicit LLM selection
      return models.find(model => model.id === currentMissionLlmId) || null;
    } else {
      // Mission is using default model
      return models.find(model => model.is_default) || null;
    }
  };

  const currentModel = getCurrentModel();
  const isUsingDefault = !currentMissionLlmId;

  const handleModelSelect = async (model: AIModel) => {
    if (!currentMissionId || model.id === currentMissionLlmId) {
      return; // No mission or already selected
    }

    setLoadingModelId(model.id);
    
    try {
      // Update mission's LLM
      const response = await authenticatedFetch(
        buildApiUrl(`/api/v1/missions/${currentMissionId}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            llm_id: model.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update mission: ${response.status} ${response.statusText}`);
      }

      // Update context atomically
      setMissionData(currentMissionId, model.id);

    } catch (error) {
      // Error handling without logging
    } finally {
      setLoadingModelId(null);
    }
  };

  const getModelInfo = (modelName: string) => {
    if (modelName.includes('gpt')) {
      return {
        provider: 'OpenAI',
        contextSize: modelName.includes('4') ? '128K' : '4K'
      };
    } else if (modelName.includes('claude')) {
      return {
        provider: 'Anthropic',
        contextSize: '200K'
      };
    }
    
    return {
      provider: 'Unknown',
      contextSize: 'N/A'
    };
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-border/50">
          <div className="flex-1">
            <div className="h-4 bg-muted animate-pulse rounded w-1/3 mb-1"></div>
            <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
          </div>
          <div className="h-3 bg-muted animate-pulse rounded w-12"></div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
      <h3 className="font-medium text-destructive mb-2">Failed to Load Models</h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded transition-colors"
      >
        Retry
      </button>
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Models
          </h3>
        </div>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Models
          </h3>
        </div>
        {renderError()}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        {currentModel && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="text-sm font-medium text-foreground">
              Currently using: <span className="font-mono">{currentModel.name}</span>
              {isUsingDefault && <span className="text-muted-foreground ml-1">(Default)</span>}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-0 border border-border rounded-lg overflow-hidden">
        {models.map((model, index) => {
          const modelInfo = getModelInfo(model.name);
          const isLast = index === models.length - 1;
          const isCurrent = currentModel?.id === model.id;
          const isLoading = loadingModelId === model.id;
          
          return (
            <div 
              key={model.id} 
              className={`group flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-all duration-200 ${
                !isLast ? 'border-b border-border/50' : ''
              } ${
                isCurrent ? 'bg-accent/20 border-l-4 border-l-primary' : ''
              } ${
                !isCurrent ? 'cursor-pointer' : ''
              }`}
              onClick={() => !isCurrent && !isLoading && handleModelSelect(model)}
            >
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-mono font-medium text-sm flex items-center gap-2">
                    {model.name}
                    {isCurrent && <Check className="h-4 w-4 text-primary" />}
                    {model.is_default && !isCurrent && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {modelInfo.provider}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground font-mono">
                  {modelInfo.contextSize}
                </div>
                
                {/* Action area */}
                <div className="w-16 flex justify-end">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : isCurrent ? (
                    <span className="text-xs font-medium text-primary">Current</span>
                  ) : (
                    <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {models.length === 0 && (
        <div className="text-center py-12 border border-border rounded-lg">
          <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-muted-foreground mb-1">No Models Available</h3>
          <p className="text-sm text-muted-foreground">
            No AI models are currently configured
          </p>
        </div>
      )}
    </div>
  );
};

export default AIModelSettings;
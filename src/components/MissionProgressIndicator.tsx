import React from 'react';
import { Bot, CheckCircle, Loader2, Sparkles } from 'lucide-react';

/**
 * `project_created` is gone with the code agent -- there is no workspace to
 * set up any more. What remains is the shape every conversation has: starting,
 * working, done.
 */
export type MissionPhase = 'init' | 'execution' | 'complete';

interface MissionProgressProps {
  phase: MissionPhase;
  currentStep?: string;
  progress?: number;
}

const MissionProgressIndicator = ({ phase, currentStep, progress }: MissionProgressProps) => {
  const getPhaseIcon = () => {
    switch (phase) {
      case 'init':
        return <Bot className="h-4 w-4 animate-pulse text-muted-foreground" />;
      case 'execution':
        return <Sparkles className="h-4 w-4 text-muted-foreground" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case 'init':
        return 'Getting started…';
      case 'execution':
        return currentStep || 'Working on it…';
      case 'complete':
        return 'Done';
      default:
        return 'Processing…';
    }
  };

  return (
    <div className="flex justify-start group animate-fade-in">
      <div className="flex flex-col max-w-[80%] items-start">
        <div className="rounded-2xl border border-border bg-card px-5 py-3">
          <div className="mb-2 flex items-center gap-2.5">
            {getPhaseIcon()}
            <span className="text-sm font-medium text-foreground">Thinking</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{getPhaseMessage()}</p>

            {progress !== undefined && phase === 'execution' && (
              <div className="h-1 w-full rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-foreground/60 transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionProgressIndicator;

import React from 'react';
import { Bot, Folder, Code2, CheckCircle, Loader2 } from 'lucide-react';

export type MissionPhase = 'init' | 'project_created' | 'execution' | 'complete';

interface MissionProgressProps {
  phase: MissionPhase;
  projectName?: string;
  currentStep?: string;
  progress?: number;
}

const MissionProgressIndicator = ({ phase, projectName, currentStep, progress }: MissionProgressProps) => {
  const getPhaseIcon = () => {
    switch (phase) {
      case 'init':
        return <Bot className="h-6 w-6 text-blue-500 animate-pulse" />;
      case 'project_created':
        return <Folder className="h-6 w-6 text-green-500" />;
      case 'execution':
        return <Code2 className="h-6 w-6 text-purple-600" />;
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case 'init':
        return '🚀 Initializing your coding mission...';
      case 'project_created':
        return `📁 Setting up workspace for ${projectName || 'your project'}...`;
      case 'execution':
        return currentStep || '⚡ Developing your project...';
      case 'complete':
        return '✅ Mission completed! Transitioning to code agent...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="flex justify-start group animate-fade-in">
      <div className="flex flex-col max-w-[80%] items-start">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            {getPhaseIcon()}
            <span className="font-medium text-gray-800">Missioning</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{getPhaseMessage()}</p>
            
            {progress !== undefined && phase === 'execution' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
            
            {projectName && phase === 'project_created' && (
              <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                Project: <span className="font-mono">{projectName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionProgressIndicator;
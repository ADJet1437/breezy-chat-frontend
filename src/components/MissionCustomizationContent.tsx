import React, { useState } from 'react';
import { X, MessageSquare, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import SettingsSection from './SettingsSection';
import SystemPromptSettings from './SystemPromptSettings';
import FilesSettings from './FilesSettings';

interface MissionCustomizationContentProps {
  missionId: string;
  systemPrompt?: string;
  onClose: () => void;
  onSystemPromptUpdate: (newPrompt: string) => void;
  showCloseButton?: boolean;
  containerClassName?: string;
}

const MissionCustomizationContent: React.FC<MissionCustomizationContentProps> = ({
  missionId,
  systemPrompt = '',
  onClose,
  onSystemPromptUpdate,
  showCloseButton = true,
  containerClassName = '',
}) => {
  const [expandedSection, setExpandedSection] = useState<'systemPrompt' | 'files' | null>('systemPrompt');

  const toggleSection = (section: 'systemPrompt' | 'files') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={`flex flex-col h-full ${containerClassName}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Customize Mission</h2>
        </div>
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {/* System Prompt Section */}
          <SettingsSection
            title="System Prompt"
            icon={<MessageSquare className="h-5 w-5" />}
            isExpanded={expandedSection === 'systemPrompt'}
            onToggle={() => toggleSection('systemPrompt')}
          >
            <SystemPromptSettings
              missionId={missionId}
              systemPrompt={systemPrompt}
              onSystemPromptUpdate={onSystemPromptUpdate}
            />
          </SettingsSection>

          {/* Files Section */}
          <SettingsSection
            title="Files"
            icon={<FolderOpen className="h-5 w-5" />}
            isExpanded={expandedSection === 'files'}
            onToggle={() => toggleSection('files')}
          >
            <FilesSettings missionId={missionId} />
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MissionCustomizationContent;
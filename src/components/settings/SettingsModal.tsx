import React, { useState } from 'react';
import { X, MessageSquare, FolderOpen, Settings, Brain, Zap, User, CreditCard, BarChart3, Shield, Database, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import SystemPromptSettings from './mission/SystemPromptSettings';
import FilesSettings from './mission/FilesSettings';
import ProfileSettings from './global/ProfileSettings';
import PlansSettings from './global/PlansSettings';
import { PreferencesSettings } from './global/PreferencesSettings';
import { AccountSettings } from './account';
import { UsageStatsCard } from './UsageStatsCard';
import { KnowledgeBaseSettings } from './global/KnowledgeBaseSettings';

type SettingsContext = 'mission' | 'global';
type MissionTab = 'systemPrompt' | 'files' | 'aiModel';
type GlobalTab = 'profile' | 'plans' | 'preferences' | 'usage' | 'account' | 'knowledgeBase';
type SettingsTab = MissionTab | GlobalTab;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: SettingsContext;
  missionId?: string;
  systemPrompt?: string;
  onSystemPromptUpdate?: (newPrompt: string) => void;
  initialTab?: SettingsTab;
}

const missionTabs = [
  {
    id: 'systemPrompt' as MissionTab,
    label: 'System Prompt',
    icon: MessageSquare,
  },
  {
    id: 'files' as MissionTab,
    label: 'Files',
    icon: FolderOpen,
  },
  {
    id: 'aiModel' as MissionTab,
    label: 'AI Model',
    icon: Brain,
  }
];

const globalTabs = [
  {
    id: 'profile' as GlobalTab,
    label: 'Profile',
    icon: User,
  },
  {
    id: 'plans' as GlobalTab,
    label: 'Subscription',
    icon: CreditCard,
  },
  {
    id: 'preferences' as GlobalTab,
    label: 'Theme',
    icon: Palette,
  },
  {
    id: 'usage' as GlobalTab,
    label: 'Usage',
    icon: BarChart3,
  },
  {
    id: 'account' as GlobalTab,
    label: 'Account',
    icon: Shield,
  },
  {
    id: 'knowledgeBase' as GlobalTab,
    label: 'Knowledge',
    icon: Database,
  }
];

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  context,
  missionId,
  systemPrompt = '',
  onSystemPromptUpdate,
  initialTab,
}) => {
  const isMissionContext = context === 'mission';
  const tabs = isMissionContext ? missionTabs : globalTabs;
  const defaultTab = isMissionContext ? 'systemPrompt' : 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || defaultTab);

  // Update active tab when initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const renderTabContent = () => {
    if (isMissionContext) {
      switch (activeTab as MissionTab) {
        case 'systemPrompt':
          return (
            <div className="p-6">
              <SystemPromptSettings
                missionId={missionId!}
                systemPrompt={systemPrompt}
                onSystemPromptUpdate={onSystemPromptUpdate!}
              />
            </div>
          );
        
        case 'files':
          return (
            <div className="p-6">
              <FilesSettings missionId={missionId!} />
            </div>
          );
        
        case 'aiModel':
          return (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Model Settings</h3>
              <p className="text-muted-foreground">AI model selection and parameters will go here.</p>
            </div>
          );
      }
    } else {
      switch (activeTab as GlobalTab) {
        case 'profile':
          return (
            <div className="p-6">
              <ProfileSettings />
            </div>
          );
        
        case 'plans':
          return (
            <div className="p-6">
              <PlansSettings />
            </div>
          );
        
        case 'preferences':
          return (
            <div className="p-6">
              <PreferencesSettings />
            </div>
          );
        
        
        case 'usage':
          return (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Usage & Analytics</h3>
              </div>
              <UsageStatsCard />
            </div>
          );
        
        case 'account':
          return (
            <div className="p-6">
              <AccountSettings />
            </div>
          );
          
        case 'knowledgeBase':
          return (
            <div className="p-6">
              <KnowledgeBaseSettings />
            </div>
          );
      }
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] p-0 gap-0">
        <DialogTitle className="sr-only">
          {isMissionContext ? 'Mission Settings' : 'Settings'}
        </DialogTitle>
        <div className="flex h-full">
          {/* Left Sidebar Navigation */}
          <div className="w-64 border-r border-border bg-muted/50">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                      <div className={`font-medium text-sm ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                        {tab.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-background">
            <ScrollArea className="h-full">
              <div className="pt-12">
                {renderTabContent()}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
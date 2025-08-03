import React, { useState } from 'react';
import { X, MessageSquare, FolderOpen, Settings, Brain, Zap, User, CreditCard, Lock, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import SystemPromptSettings from './mission/SystemPromptSettings';
import FilesSettings from './mission/FilesSettings';
import ProfileSettings from './global/ProfileSettings';
import PlansSettings from './global/PlansSettings';
import { AccountSettings } from './account';

type SettingsContext = 'mission' | 'global';
type MissionTab = 'systemPrompt' | 'files' | 'aiModel';
type GlobalTab = 'profile' | 'plans' | 'preferences' | 'security' | 'usage' | 'account';
type SettingsTab = MissionTab | GlobalTab;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: SettingsContext;
  missionId?: string;
  systemPrompt?: string;
  onSystemPromptUpdate?: (newPrompt: string) => void;
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
    label: 'Plans & Billing',
    icon: CreditCard,
  },
  {
    id: 'preferences' as GlobalTab,
    label: 'Preferences',
    icon: Settings,
  },
  {
    id: 'security' as GlobalTab,
    label: 'Security',
    icon: Lock,
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
  }
];

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  context,
  missionId,
  systemPrompt = '',
  onSystemPromptUpdate,
}) => {
  const isMissionContext = context === 'mission';
  const tabs = isMissionContext ? missionTabs : globalTabs;
  const defaultTab = isMissionContext ? 'systemPrompt' : 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

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
              <p className="text-gray-600">AI model selection and parameters will go here.</p>
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
              <h3 className="text-lg font-semibold mb-4">Preferences</h3>
              <p className="text-gray-600">Application-wide preferences and settings will go here.</p>
            </div>
          );
        
        case 'security':
          return (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Security</h3>
              <p className="text-gray-600">Password, two-factor authentication, and security settings will go here.</p>
            </div>
          );
        
        case 'usage':
          return (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Usage & Analytics</h3>
              <p className="text-gray-600">Usage statistics and account limits will go here.</p>
            </div>
          );
        
        case 'account':
          return (
            <div className="p-6">
              <AccountSettings />
            </div>
          );
      }
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Left Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 bg-gray-50/50">
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
                          ? 'bg-gray-200 text-gray-800 shadow-sm'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-gray-600' : 'text-gray-500'}`} />
                      <div className={`font-medium text-sm ${isActive ? 'text-gray-800' : 'text-gray-900'}`}>
                        {tab.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white">
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
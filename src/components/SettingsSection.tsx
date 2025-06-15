import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  containerClassName?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  containerClassName = '',
}) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {/* Section Header */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full justify-start p-3 h-auto text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {icon}
          <span className="font-medium">{title}</span>
          <div className="ml-auto">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </Button>

      {/* Section Content */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
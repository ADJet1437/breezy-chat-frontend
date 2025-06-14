import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import MissionCustomizationContent from './MissionCustomizationContent';

interface MissionCustomizationResponsiveProps {
  isOpen: boolean;
  onClose: () => void;
  missionId: string;
  systemPrompt?: string;
  onSystemPromptUpdate: (newPrompt: string) => void;
}

const MissionCustomizationResponsive: React.FC<MissionCustomizationResponsiveProps> = ({
  isOpen,
  onClose,
  missionId,
  systemPrompt = '',
  onSystemPromptUpdate,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkMobile();

    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Mobile Sheet - only render when actually mobile */}
      {isMobile && (
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent 
            side="bottom" 
            className="h-[85vh] p-0 pb-safe"
            style={{ 
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              maxHeight: 'calc(100vh - 2rem)'
            }}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Customize Mission</SheetTitle>
              <SheetDescription>
                Customize the system prompt and other settings for this mission
              </SheetDescription>
            </SheetHeader>
            <MissionCustomizationContent
              missionId={missionId}
              systemPrompt={systemPrompt}
              onClose={onClose}
              onSystemPromptUpdate={onSystemPromptUpdate}
              showCloseButton={false} // Sheet has its own close button
              containerClassName="h-full"
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar - only render when not mobile */}
      {!isMobile && isOpen && (
        <div className="fixed right-0 top-16 bottom-0 w-80 bg-sidebar border-l border-sidebar-border z-30">
          <MissionCustomizationContent
            missionId={missionId}
            systemPrompt={systemPrompt}
            onClose={onClose}
            onSystemPromptUpdate={onSystemPromptUpdate}
            showCloseButton={true}
            containerClassName="h-full bg-sidebar text-sidebar-foreground"
          />
        </div>
      )}
    </>
  );
};

export default MissionCustomizationResponsive;
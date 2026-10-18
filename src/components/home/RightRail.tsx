import React from 'react';
import { Database, FileText, ListChecks, Network } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * The floating rail on the right edge.
 *
 * Each item names a workspace surface that does not exist yet, so the buttons
 * are inert and labelled as such on hover rather than routed somewhere wrong.
 * Hidden below xl, where the main column needs the width more than the rail
 * needs a home.
 */
const ITEMS = [
  { title: 'Tasks', icon: ListChecks },
  { title: 'Swarm', icon: Network },
  { title: 'Knowledge', icon: Database },
  { title: 'Documents', icon: FileText },
];

export function RightRail() {
  return (
    <TooltipProvider>
      <div className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 rounded-2xl border border-border bg-card/70 p-1.5 backdrop-blur-sm xl:flex">
        {ITEMS.map(item => (
          <Tooltip key={item.title}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled
                aria-label={item.title}
                className="flex h-9 w-9 cursor-default items-center justify-center rounded-xl text-muted-foreground opacity-70 transition-colors hover:bg-accent hover:text-foreground"
              >
                <item.icon className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{item.title} — not available yet</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

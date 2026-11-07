import React, { useEffect, useRef, useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';

interface Props {
  content: string;
  /** Still streaming — the model has not finished reasoning. */
  streaming?: boolean;
}

/**
 * The model's reasoning for one turn.
 *
 * Collapsed by default and quiet: it explains the answer, it is not the
 * answer. Expanded while it streams, because during the minutes a tool takes
 * this is the only thing happening — and it is what shows *why* the agent
 * picked the tool it did.
 */
export const ThinkingMessage: React.FC<Props> = ({ content, streaming }) => {
  const [open, setOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  // Boolean, not `open || streaming`: streaming is optional, so that
  // expression is `undefined` when the block is closed and React drops
  // the aria-expanded attribute entirely rather than writing "false".
  const expanded = open || Boolean(streaming);

  // Follow the newest text while it streams. Without this the pane holds its
  // scroll at the top once the reasoning is taller than the cap, so the user
  // watches a motionless block during the one part of a long turn where
  // something is visibly happening.
  useEffect(() => {
    if (!streaming) return;
    const pane = scroller.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [content, streaming]);

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[85%] overflow-hidden rounded-lg border border-border bg-card/40">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Brain className={`h-3.5 w-3.5 shrink-0 ${streaming ? 'animate-pulse' : ''}`} />
          <span className="font-medium">
            {streaming ? 'Thinking…' : 'Thought process'}
          </span>
          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${
              expanded ? '' : '-rotate-90'
            }`}
          />
        </button>

        {expanded && (
          // Capped and scrollable, the same as the tool chip beside it and
          // for the same reason: reasoning for one round of an app build
          // runs to several hundred words, and at full height it pushed the
          // answer -- and every earlier message -- off the screen. Expanded
          // while streaming makes that the default state, not a rare one.
          <div
            ref={scroller}
            className="max-h-56 overflow-y-auto border-t border-border px-3 py-2"
          >
            <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-muted-foreground">
              {content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

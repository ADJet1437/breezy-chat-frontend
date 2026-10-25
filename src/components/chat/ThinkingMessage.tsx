import React, { useState } from 'react';
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
  const expanded = open || streaming;

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
          <div className="border-t border-border px-3 py-2">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
              {content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

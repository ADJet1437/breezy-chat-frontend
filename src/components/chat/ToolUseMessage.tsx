import React, { useState } from 'react';
import { AlertCircle, Check, ChevronDown, Loader2, Wrench } from 'lucide-react';

interface Props {
  toolName: string;
  summary?: string;
  failed?: boolean;
  /** Still running. A tool that writes a deck takes minutes, and a chip that
      shows a tick the whole time reads as finished-but-broken. */
  running?: boolean;
  /** What the tool has reported so far, oldest first. */
  progress?: string[];
}

/**
 * What the agent is doing, reported as it happens.
 *
 * Built like the thinking block, for the same reason: a deck takes two to five
 * minutes, and a single line that never changes is indistinguishable from a
 * hang. The tool streams its own progress — planning, each slide, building,
 * rendering — and this shows that stream while it runs, collapsing to one line
 * once it finishes.
 *
 * Still a summary, not a transcript: the backend keeps the whole call,
 * including the script, for the model. A person wants to know a deck is being
 * written, not read three hundred lines of python-pptx.
 */
export const ToolUseMessage: React.FC<Props> = ({
  toolName,
  summary,
  failed,
  running,
  progress,
}) => {
  const [open, setOpen] = useState(false);
  const log = progress ?? [];
  // Nothing to expand into until the tool has said more than its opening line.
  const expandable = log.length > 1;
  // Expanded while it runs, so the stream is visible without a click.
  const expanded = expandable && (open || running);

  const icon = failed ? (
    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
  ) : running ? (
    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
  ) : (
    <Wrench className="h-3.5 w-3.5 shrink-0" />
  );

  const header = (
    <>
      {icon}
      <span className="font-medium">{toolName.replace(/_/g, ' ')}</span>
      {summary && <span className="truncate opacity-70">· {summary}</span>}
    </>
  );

  if (!expandable) {
    return (
      <div className="flex justify-start">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
            failed
              ? 'border-destructive/40 text-destructive'
              : 'border-border text-muted-foreground'
          }`}
        >
          {header}
          {!failed && !running && (
            <Check className="h-3.5 w-3.5 shrink-0 opacity-50" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={`w-full max-w-[85%] overflow-hidden rounded-lg border bg-card/40 ${
          failed ? 'border-destructive/40' : 'border-border'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={expanded}
          className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:text-foreground ${
            failed ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {header}
          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${
              expanded ? '' : '-rotate-90'
            }`}
          />
        </button>

        {expanded && (
          <div className="border-t border-border px-3 py-2">
            <ol className="space-y-1">
              {log.map((step, index) => (
                <li
                  key={`${index}_${step}`}
                  className={`text-[13px] leading-relaxed ${
                    index === log.length - 1 && running
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

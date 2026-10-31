import React, { useEffect, useRef, useState } from 'react';
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
  const scroller = useRef<HTMLDivElement>(null);
  const log = progress ?? [];
  // Nothing to expand into until the tool has said more than its opening line.
  const expandable = log.length > 1;
  // Expanded while it runs, so the stream is visible without a click.
  const expanded = expandable && (open || running);

  // Follow the newest line while the tool runs. Without this the pane holds
  // its scroll at the top and the step that is actually happening is below
  // the fold -- which is the one line worth reading.
  useEffect(() => {
    if (!running) return;
    const pane = scroller.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [log.length, running]);

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
      {/* Holds its width against a long summary, but can still truncate:
          shrink-0 alone means a narrow pane overflows rather than eliding. */}
      <span className="min-w-0 max-w-[45%] shrink-0 truncate font-medium">
        {toolName.replace(/_/g, ' ')}
      </span>
      {/* min-w-0 is what makes `truncate` work at all. A flex item defaults
          to min-width:auto, so without it the span refuses to shrink below
          its text, the chip grows to fit, and a long tool message pushes the
          whole conversation wider than the window. */}
      {summary && <span className="min-w-0 truncate opacity-70">· {summary}</span>}
    </>
  );

  if (!expandable) {
    return (
      <div className="flex min-w-0 justify-start">
        <div
          className={`flex min-w-0 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
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
    <div className="flex min-w-0 justify-start">
      <div
        className={`w-full min-w-0 max-w-[85%] overflow-hidden rounded-lg border bg-card/40 ${
          failed ? 'border-destructive/40' : 'border-border'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={expanded}
          className={`flex w-full min-w-0 items-center gap-2 px-3 py-2 text-xs transition-colors hover:text-foreground ${
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
          // Capped and scrollable: a deck reports twenty-odd steps, and at
          // full height the block pushed the answer off the screen.
          <div
            ref={scroller}
            className="max-h-56 overflow-y-auto border-t border-border px-3 py-2"
          >
            <ol className="space-y-1">
              {log.map((step, index) => (
                <li
                  key={`${index}_${step}`}
                  // Tool output carries file lists and stack traces: long
                  // unbroken runs with nowhere natural to wrap.
                  className={`break-words text-[13px] leading-relaxed ${
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

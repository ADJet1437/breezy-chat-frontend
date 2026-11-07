import { useState } from 'react';
import { Check, Copy, FileText, Loader2 } from 'lucide-react';
import { useDocument, type DiffLine } from './useDocument';

interface Props {
  documentId: string | null;
  title?: string | null;
  revisionSignal?: number;
}

const COPIED_FOR_MS = 1600;

/** The document as plain text, for the clipboard: the diff's own lines,
 *  minus whatever the last rewrite removed. */
function plainText(lines: DiffLine[]): string {
  return lines
    .filter(line => line.kind !== 'removed')
    .map(line => line.text)
    .join('\n');
}

/**
 * A document the agent wrote, with the last rewrite marked.
 *
 * Changes are shown rather than merely applied. A model handed a whole
 * document and asked for one change will sometimes reword three other
 * things on the way past, and a panel that only showed the result would
 * make that invisible -- the user would have to re-read a CV they already
 * knew, every time, to trust it. Removed lines stay on screen, struck
 * through, so a deletion is as visible as an edit.
 */
export function DocumentPanel({ documentId, title, revisionSignal = 0 }: Props) {
  const { diff, loading, error } = useDocument(documentId, revisionSignal);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!diff) return;
    try {
      await navigator.clipboard.writeText(plainText(diff.lines));
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FOR_MS);
    } catch {
      // Denied clipboard permission, or an insecure origin. The text is on
      // screen and selectable either way.
    }
  };

  if (!documentId) return null;

  return (
    <div className="flex h-full min-w-0 flex-col bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        {/* min-w-0 is what makes truncate work: a flex item defaults to
            min-width:auto and would otherwise push the panel wider than
            its pane rather than eliding. */}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {title || 'Document'}
        </span>
        {diff && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            v{diff.revision}
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          disabled={!diff}
          aria-label="Copy document"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </header>

      {diff?.summary && (
        // Above the diff on purpose: the agent's claim about what it changed,
        // sitting next to the evidence, so one can be checked against the
        // other.
        <p className="shrink-0 border-b bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground">
          {diff.summary}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading && !diff && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {diff && (
          <article className="space-y-0.5">
            {diff.lines.map((line, index) => (
              <Line key={`${index}_${line.kind}`} line={line} />
            ))}
          </article>
        )}
      </div>
    </div>
  );
}

function Line({ line }: { line: DiffLine }) {
  // Blank lines carry the document's paragraph breaks; rendering nothing
  // would run every section together.
  if (!line.text.trim() && line.kind === 'same') return <div className="h-3" />;

  const tone =
    line.kind === 'added'
      ? 'bg-emerald-500/10 text-foreground'
      : line.kind === 'removed'
        ? 'bg-destructive/10 text-muted-foreground line-through'
        : 'text-foreground';

  return (
    <p
      // break-words because a CV carries URLs and long unbroken tokens with
      // nowhere natural to wrap.
      className={`whitespace-pre-wrap break-words rounded px-2 py-0.5 text-[13px] leading-relaxed ${tone}`}
    >
      {line.text || ' '}
    </p>
  );
}

import { useState } from 'react';
import { Check, Copy, FileText, Loader2 } from 'lucide-react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { useDocument } from './useDocument';

interface Props {
  documentId: string | null;
  title?: string | null;
  revisionSignal?: number;
}

const COPIED_FOR_MS = 1600;

/**
 * The document the agent is working on, rendered to read.
 *
 * It showed a line-by-line diff first, and that was wrong. Line diffing
 * suits bullets and ruins prose: change three words in a paragraph and the
 * whole paragraph is struck through and re-added, so the document becomes
 * unreadable at exactly the moment the user wants to read it. What changed
 * is said in a sentence above instead -- the agent's own summary -- and the
 * text below is just the document.
 *
 * Revisions are still kept server-side. They are not shown.
 */
export function DocumentPanel({ documentId, title, revisionSignal = 0 }: Props) {
  const { document, loading, error } = useDocument(documentId, revisionSignal);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!document) return;
    try {
      await navigator.clipboard.writeText(document.content);
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
            min-width:auto and would otherwise push the panel wider than its
            pane rather than eliding. */}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {document?.title || title || 'Document'}
        </span>
        {document && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            v{document.revision}
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          disabled={!document}
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

      {document?.summary && (
        // What changed, in the agent's words. This is the whole of the
        // change-tracking now that the diff is gone, so it earns its place
        // at the top rather than being buried in the transcript.
        <p className="shrink-0 border-b bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground">
          {document.summary}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {loading && !document && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {document && (
          // The same renderer the transcript uses, so a heading looks like a
          // heading rather than a line beginning with #. max-w-full and the
          // prose wrapper keep a long URL from widening the pane.
          <div className="prose prose-sm max-w-full dark:prose-invert">
            <MarkdownRenderer content={document.content} />
          </div>
        )}
      </div>
    </div>
  );
}

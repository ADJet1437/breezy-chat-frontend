import { useState } from 'react';
import { Check, Copy, Eye, FileText, Loader2, Pencil } from 'lucide-react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { useDocument } from './useDocument';

interface Props {
  documentId: string | null;
  title?: string | null;
  revisionSignal?: number;
  /** The agent is writing. The editor locks rather than letting the user
   *  type into text that is about to be replaced. */
  busy?: boolean;
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
 *
 * It is also editable. A user edit is saved as a revision like any the
 * agent writes, which is what makes it survive: current_revision is the
 * version token both writers share, and the agent must send back the one
 * it was working from. A number it has not seen refuses its write instead
 * of overwriting what was typed here.
 */
export function DocumentPanel({
  documentId,
  title,
  revisionSignal = 0,
  busy = false,
}: Props) {
  const { document, loading, error, draft, setDraft, saving } = useDocument(
    documentId,
    revisionSignal
  );
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  // Markdown source, not a WYSIWYG. A rich editor round-tripping through
  // its own model quietly mangles documents, and a corrupted CV is worse
  // than no editor at all.
  const canEdit = Boolean(document) && !busy;

  const copy = async () => {
    if (!document) return;
    try {
      await navigator.clipboard.writeText(draft);
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
        {saving && (
          <span className="shrink-0 text-[11px] text-muted-foreground">
            Saving…
          </span>
        )}
        {document && !saving && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            v{document.revision}
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing(v => !v)}
          disabled={!canEdit}
          aria-label={editing ? 'Preview document' : 'Edit document'}
          aria-pressed={editing}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          {editing ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <Pencil className="h-3.5 w-3.5" />
          )}
        </button>
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

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {loading && !document && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {document && editing && (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            spellCheck
            aria-label="Document source"
            className="h-full min-h-[300px] w-full resize-none border-0 bg-transparent font-mono text-[13px] leading-relaxed text-foreground focus:outline-none"
          />
        )}

        {document && !editing && (
          // The same renderer the transcript uses, so a heading looks like a
          // heading rather than a line beginning with #. The draft, not the
          // fetched content: an edit should show in the preview before the
          // debounce has saved it.
          <div className="prose prose-sm max-w-full dark:prose-invert">
            <MarkdownRenderer content={draft} />
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Check, Copy, FileText, Loader2 } from 'lucide-react';
import { DocumentEditor } from './DocumentEditor';
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
 * It is an editor, always -- there is no read mode to switch out of. The
 * document is the thing the user came for, and a panel that showed it
 * read-only until a button was pressed made editing feel like a mode
 * rather than the point.
 *
 * A user edit is saved as a revision like any the agent writes, which is
 * what makes it survive: current_revision is the version token both
 * writers share, and the agent must send back the one it was working
 * from. A number it has not seen refuses its write instead of overwriting
 * what was typed here.
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

      <div className="flex min-h-0 flex-1 flex-col">
        {loading && !document && (
          <div className="flex items-center gap-2 px-5 py-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {error && <p className="px-5 py-5 text-sm text-destructive">{error}</p>}

        {document && (
          <DocumentEditor
            value={draft}
            onChange={setDraft}
            readOnly={busy}
          />
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { authenticatedGet, authenticatedPut } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';

export interface DocumentContent {
  id: string;
  title: string;
  revision: number;
  content: string;
  summary: string | null;
}

interface UseDocumentResult {
  document: DocumentContent | null;
  loading: boolean;
  error: string | null;
  /** What is on screen, including keystrokes not yet saved. */
  draft: string;
  setDraft: (text: string) => void;
  saving: boolean;
}

/** Idle time before a draft is saved. Long enough that typing a sentence is
 *  one revision, short enough that nobody loses work by closing the tab. */
const SAVE_AFTER_IDLE_MS = 1200;

/**
 * The document the agent is working on.
 *
 * `revisionSignal` is bumped by the stream when write_document finishes, as
 * decks do. Without it the panel would show the first version for the rest
 * of the conversation.
 */
export function useDocument(
  documentId: string | null,
  revisionSignal = 0
): UseDocumentResult {
  const [document, setDocument] = useState<DocumentContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  // What the server last confirmed. Compared against the draft so a save
  // fires on a real change rather than on every blur.
  const saved = useRef('');

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      return;
    }

    // A response for a document the user has already navigated away from
    // must not land on the one now on screen.
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await authenticatedGet(
          buildApiUrl(`/api/v1/documents/${documentId}`)
        );
        if (cancelled) return;
        if (!response.ok) {
          setError('Could not load the document.');
          return;
        }
        const data = await response.json();
        if (cancelled) return;
        setDocument(data);
        // The agent's version replaces what is on screen. A draft the user
        // was midway through is already saved -- the debounce is shorter
        // than a turn -- and the agent wrote from it.
        setDraft(data.content);
        saved.current = data.content;
      } catch {
        if (!cancelled) setError('Could not load the document.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId, revisionSignal]);

  // Save after a pause. Each save is a revision, and current_revision is
  // the version token the agent must send back -- so a saved edit is also
  // what stops the agent's next write from overwriting it.
  useEffect(() => {
    if (!documentId || !document) return;
    if (draft === saved.current) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const response = await authenticatedPut(
          buildApiUrl(`/api/v1/documents/${documentId}`),
          { content: draft }
        );
        if (!response.ok) return;
        const data = await response.json();
        saved.current = draft;
        // Take the new revision number, not the text: the user may have
        // typed on while this was in flight, and replacing the draft with
        // the response would delete those keystrokes.
        setDocument(current =>
          current ? { ...current, revision: data.revision } : current
        );
      } catch {
        // Left unsaved rather than lost: the draft is still on screen and
        // the next pause tries again.
      } finally {
        setSaving(false);
      }
    }, SAVE_AFTER_IDLE_MS);

    return () => clearTimeout(timer);
  }, [draft, documentId, document]);

  return { document, loading, error, draft, setDraft, saving };
}

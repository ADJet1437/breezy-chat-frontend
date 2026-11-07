import { useEffect, useState } from 'react';
import { authenticatedGet } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';

export interface DiffLine {
  kind: 'same' | 'added' | 'removed';
  text: string;
}

export interface DocumentDiff {
  revision: number;
  summary: string | null;
  has_previous: boolean;
  lines: DiffLine[];
}

interface UseDocumentResult {
  diff: DocumentDiff | null;
  loading: boolean;
  error: string | null;
}

/**
 * The document and what the last rewrite changed, in one request.
 *
 * Only the diff is fetched: its `lines` already contain the whole document
 * -- unchanged lines come back as `same` -- so asking for the content
 * separately would be the same text twice.
 *
 * `revisionSignal` is bumped by the stream when write_document finishes, as
 * decks do. Without it the panel would show the first version for the rest
 * of the conversation.
 */
export function useDocument(
  documentId: string | null,
  revisionSignal = 0
): UseDocumentResult {
  const [diff, setDiff] = useState<DocumentDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setDiff(null);
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
          buildApiUrl(`/api/v1/documents/${documentId}/diff`)
        );
        if (cancelled) return;
        if (!response.ok) {
          setError('Could not load the document.');
          return;
        }
        const data = await response.json();
        if (!cancelled) setDiff(data);
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

  return { diff, loading, error };
}

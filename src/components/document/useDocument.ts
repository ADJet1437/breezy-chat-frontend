import { useEffect, useState } from 'react';
import { authenticatedGet } from '@/utils/authenticatedFetch';
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
}

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
        if (!cancelled) setDocument(data);
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

  return { document, loading, error };
}

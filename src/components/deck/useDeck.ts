import { useCallback, useEffect, useState } from 'react';
import { authenticatedGet } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';

export interface DeckSlide {
  index: number;
  image_url: string;
}

export interface DeckDocument {
  id: string;
  title: string;
  revision: number;
  slide_count: number;
  slides: DeckSlide[];
  export_url: string;
}

interface UseDeckResult {
  deck: DeckDocument | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Loads one deck.
 *
 * `revisionSignal` is bumped when the agent commits a new revision. The slide
 * images are served from URLs that do not change between revisions, so a
 * reload alone would show stale pictures from the browser cache -- the signal
 * is appended as a cache-buster on each image rather than disabling caching,
 * which would re-fetch every slide on every render.
 */
export function useDeck(deckId: string | null, revisionSignal = 0): UseDeckResult {
  const [deck, setDeck] = useState<DeckDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!deckId) {
      setDeck(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedGet(buildApiUrl(`/api/v1/decks/${deckId}`));
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'This deck is still being written.'
            : `Could not load the deck (${response.status})`
        );
      }
      setDeck(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the deck');
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void reload();
  }, [reload, revisionSignal]);

  return { deck, loading, error, reload };
}

/** Slide image URL, busted per revision so an edited slide actually updates. */
export const slideSrc = (deckId: string, index: number, revision: number) =>
  buildApiUrl(`/api/v1/decks/${deckId}/slides/${index}?r=${revision}`);

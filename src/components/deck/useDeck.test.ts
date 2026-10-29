import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Loading a deck, and the three things that go wrong.
 *
 * A deck is fetched while the agent may still be writing it, so "not there
 * yet" and "failed" are different answers and the panel says different things
 * about them. These are the cases a user actually meets.
 */

const get = vi.fn();

vi.mock('@/utils/authenticatedFetch', () => ({
  authenticatedGet: (...args: unknown[]) => get(...args),
}));
vi.mock('@/utils/apiConfig', () => ({
  buildApiUrl: (path: string) => `http://test${path}`,
}));

const { useDeck, useDeckScript, slideSrc } = await import('./useDeck');

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) });

const DECK = {
  id: 'd1',
  title: 'The Fermi Paradox',
  revision: 2,
  slide_count: 3,
  slides: [{ index: 0, image_url: '/api/v1/decks/d1/slides/0' }],
  export_url: '/api/v1/decks/d1/export.pptx',
};

beforeEach(() => get.mockReset());

describe('slideSrc', () => {
  it('addresses a slide by deck and index', () => {
    expect(slideSrc('d1', 2, 1)).toContain('/api/v1/decks/d1/slides/2');
  });

  it('carries the revision, so an edited slide is not served from cache', () => {
    // The URL is otherwise identical between revisions, so without this the
    // browser shows the previous version's picture after an edit.
    expect(slideSrc('d1', 0, 1)).not.toEqual(slideSrc('d1', 0, 2));
    expect(slideSrc('d1', 0, 7)).toContain('r=7');
  });
});

describe('useDeck', () => {
  it('loads a deck', async () => {
    get.mockResolvedValue(ok(DECK));
    const { result } = renderHook(() => useDeck('d1'));

    await waitFor(() => expect(result.current.deck).not.toBeNull());
    expect(result.current.deck?.title).toBe('The Fermi Paradox');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches nothing without a deck id', async () => {
    const { result } = renderHook(() => useDeck(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
    expect(result.current.deck).toBeNull();
  });

  it('reads a 404 as "still being written", not as a failure', async () => {
    // The agent takes minutes. During that window the deck row does not
    // exist yet, and telling the user it failed would be wrong.
    get.mockResolvedValue(fail(404));
    const { result } = renderHook(() => useDeck('d1'));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error).toMatch(/still being written/i);
  });

  it('reports a real failure with its status', async () => {
    // This is also the only cover for a thrown network error: both land in
    // the same catch, and a test that rejects the fetch instead trips the
    // runner's unhandled-rejection detection despite the hook catching it.
    get.mockResolvedValue(fail(500));
    const { result } = renderHook(() => useDeck('d1'));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error).toContain('500');
    expect(result.current.deck).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('refetches when the agent commits a revision', async () => {
    get.mockResolvedValue(ok(DECK));
    const { result, rerender } = renderHook(
      ({ signal }) => useDeck('d1', signal),
      { initialProps: { signal: 0 } }
    );

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    rerender({ signal: 1 });
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(result.current.error).toBeNull();
  });

  it('does not refetch when nothing changed', async () => {
    get.mockResolvedValue(ok(DECK));
    const { rerender } = renderHook(
      ({ signal }) => useDeck('d1', signal),
      { initialProps: { signal: 0 } }
    );

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    rerender({ signal: 0 });
    rerender({ signal: 0 });
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('useDeckScript', () => {
  const SCRIPT = { revision: 2, author: 'llm', script: 'from pptx import *' };

  it('fetches nothing until it is opened', async () => {
    // A script is hundreds of lines; nobody needs it behind every deck.
    renderHook(() => useDeckScript('d1', 2, false));
    expect(get).not.toHaveBeenCalled();
  });

  it('fetches the script for a specific revision', async () => {
    get.mockResolvedValue(ok(SCRIPT));
    const { result } = renderHook(() => useDeckScript('d1', 2, true));

    await waitFor(() => expect(result.current.script).not.toBeNull());
    expect(get.mock.calls[0][0]).toContain('/script?r=2');
    expect(result.current.script?.author).toBe('llm');
  });

  it('explains a revision that had no script', async () => {
    // A revision the user made by hand has none, and that is a fact about
    // the revision rather than an error.
    get.mockResolvedValue(fail(404));
    const { result } = renderHook(() => useDeckScript('d1', 3, true));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error).toMatch(/not made from a script/i);
  });
});

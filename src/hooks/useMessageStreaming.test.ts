/**
 * Which mission a message is sent to.
 *
 * A conversation started from /chat gets its id from the server, mid-stream,
 * and the URL is corrected with `window.history.replaceState`. That moves the
 * address bar and nothing else: React Router never learns, so `useParams`
 * keeps returning undefined for the rest of the session.
 *
 * The send path used to read only the route. So every message after the first
 * arrived with no mission_id, and the backend did what it was told -- a brand
 * new mission each time, with no history. On screen the transcript looked
 * continuous, because the component keeps appending to its own array, but the
 * model was answering the first message of a fresh conversation every time
 * and said so: "options A and B haven't appeared in our conversation".
 *
 * Nothing here renders a component; the fetch boundary is stubbed and what is
 * asserted is the request body.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMessageStreaming } from './useMessageStreaming';

const NEW_MISSION = 'aaaaaaaa-1111-2222-3333-444444444444';

/** An SSE body announcing `missionId`, then finishing. */
function stream(missionId: string): Response {
  const body = [
    `data: ${JSON.stringify({ event_type: 'mission_init', answer: missionId })}\n\n`,
    `data: ${JSON.stringify({ event_type: 'mission_content', answer: 'ok' })}\n\n`,
  ].join('');

  return {
    ok: true,
    status: 200,
    body: {
      getReader() {
        let done = false;
        return {
          read: async () => {
            if (done) return { done: true, value: undefined };
            done = true;
            return { done: false, value: new TextEncoder().encode(body) };
          },
          releaseLock() {},
        };
      },
    },
  } as unknown as Response;
}

let sent: any[] = [];

beforeEach(() => {
  sent = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async (url: any, init: any) => {
      const href = String(url);
      // Reopening a conversation also fetches its deck and its app; only
      // the send is under test here.
      if (href.includes('/missions/complete')) {
        sent.push(JSON.parse(init?.body ?? '{}'));
        return stream(NEW_MISSION);
      }
      return { ok: true, status: 200, json: async () => [] } as unknown as Response;
    }
  );
  // The component corrects the URL itself; keep jsdom quiet about it.
  vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function harness(missionId?: string) {
  return renderHook(() =>
    useMessageStreaming({
      missionId,
      messages: [],
      setMessages: () => {},
      setCurrentMissionId: () => {},
      attachedFileIds: [],
      setAttachedFileIds: () => {},
      setAttachedFileDetails: () => {},
      inputBarRef: { current: null },
    } as any)
  );
}

describe('a conversation started from /chat', () => {
  it('sends the first message with no mission, and the second with one', async () => {
    const { result } = harness(undefined);

    await act(async () => {
      await result.current.sendMessageToBackend('build me an app');
    });
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0].mission_id).toBeUndefined();

    await act(async () => {
      await result.current.sendMessageToBackend('option A please');
    });
    await waitFor(() => expect(sent).toHaveLength(2));

    // The regression: this was undefined, so the backend started over.
    expect(sent[1].mission_id).toBe(NEW_MISSION);
  });

  it('keeps using the same mission for every later message', async () => {
    const { result } = harness(undefined);

    for (const text of ['one', 'two', 'three', 'four']) {
      await act(async () => {
        await result.current.sendMessageToBackend(text);
      });
    }
    await waitFor(() => expect(sent).toHaveLength(4));

    expect(sent.slice(1).map(r => r.mission_id)).toEqual([
      NEW_MISSION,
      NEW_MISSION,
      NEW_MISSION,
    ]);
  });
});

describe('a conversation reopened from /chat/:id', () => {
  it('sends the route mission from the very first message', async () => {
    const existing = 'bbbbbbbb-5555-6666-7777-888888888888';
    const { result } = harness(existing);

    await act(async () => {
      await result.current.sendMessageToBackend('carry on');
    });
    await waitFor(() => expect(sent).toHaveLength(1));

    expect(sent[0].mission_id).toBe(existing);
  });

  it('prefers the route over anything this session created', async () => {
    const existing = 'bbbbbbbb-5555-6666-7777-888888888888';
    const { result } = harness(existing);

    await act(async () => {
      await result.current.sendMessageToBackend('one');
    });
    await act(async () => {
      await result.current.sendMessageToBackend('two');
    });
    await waitFor(() => expect(sent).toHaveLength(2));

    expect(sent.map(r => r.mission_id)).toEqual([existing, existing]);
  });
});

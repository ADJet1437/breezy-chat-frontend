import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';

/**
 * The host side of the app's API.
 *
 * The frame holds no credential by design, so this is what actually
 * authenticates every call a generated app makes. It is therefore also the
 * thing that must not serve a call from anywhere else: any page on the
 * internet can postMessage into this window.
 */

const get = vi.fn();
const fetchMock = vi.fn();

vi.mock('@/utils/authenticatedFetch', () => ({
  authenticatedGet: (...a: unknown[]) => get(...a),
  authenticatedFetch: (...a: unknown[]) => fetchMock(...a),
}));
vi.mock('@/utils/apiConfig', () => ({ buildApiUrl: (p: string) => `http://test${p}` }));

const { useApp, useAppApiBridge, appBundleUrl, withErrorReporter } = await import('./useApp');

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

const SUMMARY = {
  app_id: 'a1', slug: 'todo-tracker', name: 'Todos',
  models: 1, pages: 1, built: true,
};
const DETAIL = { ...SUMMARY, spec: { models: [] }, files: ['src/api.ts'] };

beforeEach(() => {
  get.mockReset();
  fetchMock.mockReset();
});

describe('useApp', () => {
  it('loads the app in a conversation', async () => {
    get.mockResolvedValueOnce(ok([SUMMARY])).mockResolvedValueOnce(ok(DETAIL));
    const { result } = renderHook(() => useApp('m1'));
    await waitFor(() => expect(result.current.app).not.toBeNull());
    expect(result.current.app?.name).toBe('Todos');
    expect(result.current.error).toBeNull();
  });

  it('treats no app as nothing to show, not as an error', async () => {
    // Most conversations never build one.
    get.mockResolvedValue(ok([]));
    const { result } = renderHook(() => useApp('m1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.app).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches nothing without a conversation or a slug', async () => {
    const { result } = renderHook(() => useApp(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
  });

  it('loads by slug when there is no mission id yet', async () => {
    // A brand-new conversation has no mission id on the client: the mission
    // is created server-side during the first message. The panel sat empty
    // for the whole build because it had nothing to look the app up by.
    get.mockResolvedValue(ok(DETAIL));
    const { result } = renderHook(() => useApp(null, 0, 'todo-tracker'));

    await waitFor(() => expect(result.current.app).not.toBeNull());
    expect(result.current.app?.name).toBe('Todos');
    // Straight to the app, with no listing step.
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toContain('/api/v1/apps/todo-tracker');
  });

  it('prefers the slug it was given over searching by mission', async () => {
    get.mockResolvedValue(ok(DETAIL));
    renderHook(() => useApp('m1', 0, 'todo-tracker'));
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get.mock.calls.every(c => !String(c[0]).includes('mission_id'))).toBe(true);
  });

  it('addresses the bundle by slug', () => {
    expect(appBundleUrl('todo-tracker')).toContain('/api/v1/apps/todo-tracker/bundle');
  });
});

describe('the API bridge', () => {
  function mountBridge(slug: string | null) {
    const contentWindow = { postMessage: vi.fn() };
    const ref = createRef<HTMLIFrameElement>();
    (ref as { current: unknown }).current = { contentWindow };
    renderHook(() => useAppApiBridge(slug, ref as never));
    return { contentWindow };
  }

  const post = (data: unknown, source: unknown) =>
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data, source: source as Window }));
    });

  it('serves a call from its own frame, authenticated', async () => {
    const { contentWindow } = mountBridge('todo-tracker');
    fetchMock.mockResolvedValue(ok([{ id: '1' }]));

    post({ channel: 'talosy-api', id: 'x1', method: 'GET', path: '/todos' }, contentWindow);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('http://test/api/v1/apps/todo-tracker/api/todos');
    await waitFor(() =>
      expect(contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'talosy-api', reply: true, id: 'x1', data: [{ id: '1' }] }),
        '*'
      )
    );
  });

  it('ignores a call from any other window', async () => {
    // The security property: a page embedding or opening this one can post
    // here too, and must not get an authenticated request out of it.
    const { contentWindow } = mountBridge('todo-tracker');
    const attacker = { postMessage: vi.fn() };

    post({ channel: 'talosy-api', id: 'x2', method: 'DELETE', path: '/todos/1' }, attacker);

    await new Promise(r => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(attacker.postMessage).not.toHaveBeenCalled();
    expect(contentWindow.postMessage).not.toHaveBeenCalled();
  });

  it('refuses a path that is not a path', async () => {
    // The app names a path, never a host, so it cannot be talked into
    // reaching another app or another service.
    const { contentWindow } = mountBridge('todo-tracker');

    post({ channel: 'talosy-api', id: 'x3', method: 'GET',
           path: 'https://evil.example/steal' }, contentWindow);

    await waitFor(() =>
      expect(contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'x3', error: expect.stringContaining('Bad request path') }),
        '*'
      )
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not answer its own answers', async () => {
    // The reply is posted into the frame, and a frame that re-broadcasts it
    // would otherwise look like a fresh request with the same id.
    const { contentWindow } = mountBridge('todo-tracker');
    post({ channel: 'talosy-api', reply: true, id: 'x6', data: [] }, contentWindow);
    await new Promise(r => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores messages that are not ours', async () => {
    const { contentWindow } = mountBridge('todo-tracker');
    post({ channel: 'something-else', id: 'x4' }, contentWindow);
    post('a string', contentWindow);
    await new Promise(r => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes the server message through so the app can show it', async () => {
    const { contentWindow } = mountBridge('todo-tracker');
    fetchMock.mockResolvedValue({
      ok: false, status: 400, json: async () => ({ detail: 'title is required' }),
    });

    post({ channel: 'talosy-api', id: 'x5', method: 'POST', path: '/todos', body: {} }, contentWindow);

    await waitFor(() =>
      expect(contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'x5', error: 'title is required' }),
        '*'
      )
    );
  });
});


describe('the error reporter', () => {
  const DOC = '<!doctype html><html><head><title>x</title></head><body></body></html>';

  it('goes in before the app\'s own scripts', () => {
    const out = withErrorReporter(DOC);
    expect(out.indexOf('talosy-app-error')).toBeLessThan(out.indexOf('<title>'));
    expect(out).toContain('<!doctype html>');
    expect(out).toContain('<title>x</title>');
  });

  it('still reports for a document with no head', () => {
    const out = withErrorReporter('<div>bare</div>');
    expect(out).toContain('talosy-app-error');
    expect(out).toContain('bare');
  });

  it('listens for both throws and rejected promises', () => {
    const out = withErrorReporter(DOC);
    expect(out).toContain("addEventListener(\"error\"");
    expect(out).toContain('unhandledrejection');
  });
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatedGet, authenticatedFetch } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';

export interface AppSummary {
  app_id: string;
  slug: string;
  name: string;
  description?: string | null;
  models: number;
  pages: number;
  built: boolean;
  updated_at?: string | null;
}

export interface AppDetail extends AppSummary {
  spec: AppSpecShape;
  files: string[];
}

export interface AppSpecShape {
  name?: string;
  models?: { name: string; display_name: string; display_field: string; fields: AppFieldShape[] }[];
  endpoints?: { model: string; action: string; method: string; path: string }[];
  pages?: { name: string; route: string; model: string; kind: string; description: string }[];
  features?: string[];
}

export interface AppFieldShape {
  name: string;
  type: string;
  required: boolean;
  enum_values?: string[];
  references_model?: string | null;
}

/**
 * The app in a conversation.
 *
 * Addressed by mission, like the deck and the page: the user says "the app",
 * and the slug is an implementation detail they never see.
 */
export function useApp(
  missionId: string | null,
  revisionSignal = 0,
  slug: string | null = null
) {
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!missionId && !slug) {
      setApp(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // A slug addresses the app directly. The mission is only a way of
      // finding one when we were not told which.
      let found = slug;
      if (!found) {
        const listed = await authenticatedGet(
          buildApiUrl(`/api/v1/apps?mission_id=${missionId}`)
        );
        if (!listed.ok) throw new Error(`Could not load the app (${listed.status})`);
        const apps: AppSummary[] = await listed.json();
        if (!apps.length) {
          // The ordinary case: most conversations never build one.
          setApp(null);
          return;
        }
        found = apps[0].slug;
      }
      const detail = await authenticatedGet(buildApiUrl(`/api/v1/apps/${found}`));
      if (!detail.ok) throw new Error(`Could not load the app (${detail.status})`);
      setApp(await detail.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the app');
    } finally {
      setLoading(false);
    }
  }, [missionId, slug]);

  useEffect(() => {
    void reload();
  }, [reload, revisionSignal]);

  return { app, loading, error, reload };
}

export const appBundleUrl = (slug: string) =>
  buildApiUrl(`/api/v1/apps/${slug}/bundle`);

/**
 * Serve the app's own API calls on its behalf.
 *
 * The app runs in a sandboxed frame with no same-origin access, so it holds
 * no credential and could not send one. It posts each call here instead and
 * this makes the authenticated request — which is the whole reason
 * model-written code can be allowed to run at all.
 */
export function useAppApiBridge(slug: string | null, frame: React.RefObject<HTMLIFrameElement>) {
  const slugRef = useRef(slug);
  slugRef.current = slug;

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const call = event.data;
      if (!call || call.channel !== 'talosy-api' || typeof call.id !== 'string') return;
      if (call.reply) return;  // our own answer, echoed back
      // Only our own frame is served. Any other window may post here.
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const currentSlug = slugRef.current;
      if (!currentSlug) return;

      const reply = (body: Record<string, unknown>) =>
        frame.current?.contentWindow?.postMessage(
          // `reply: true` is what tells the page this is an answer and not
          // another request. Without it a page opened outside its frame
          // answers itself with undefined.
          { channel: 'talosy-api', reply: true, id: call.id, ...body },
          '*'
        );

      // The app names a path, never a host. It cannot be talked into
      // reaching a different app or a different service.
      const path = String(call.path ?? '');
      if (!path.startsWith('/')) {
        reply({ error: 'Bad request path.' });
        return;
      }

      try {
        const response = await authenticatedFetch(
          buildApiUrl(`/api/v1/apps/${currentSlug}/api${path}`),
          {
            method: String(call.method ?? 'GET'),
            headers: { 'Content-Type': 'application/json' },
            body: call.body === undefined ? undefined : JSON.stringify(call.body),
          }
        );
        if (!response.ok) {
          const problem = await response.json().catch(() => null);
          reply({ error: problem?.detail || `Request failed (${response.status})` });
          return;
        }
        reply({ data: response.status === 204 ? undefined : await response.json() });
      } catch (e) {
        reply({ error: e instanceof Error ? e.message : 'Request failed' });
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frame]);
}


/**
 * A reporter prepended to the app before it is embedded.
 *
 * An app that throws on its first render paints nothing, and a white
 * rectangle tells the user only that something is wrong. The frame has an
 * opaque origin so the host cannot read into it; the page has to volunteer
 * what happened, and this is the only code in there that we wrote.
 */
const ERROR_REPORTER = `<script>
(function () {
  function report(what) {
    try { window.parent.postMessage({ channel: "talosy-app-error", error: String(what).slice(0, 500) }, "*"); } catch (e) {}
  }
  window.addEventListener("error", function (e) { report((e && e.message) || "Unknown error"); });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    report((r && (r.message || r)) || "Unhandled rejection");
  });
})();
</script>`;

/** The app's document with the reporter in front of its own scripts. */
export function withErrorReporter(html: string): string {
  const head = html.indexOf('<head>');
  if (head === -1) return ERROR_REPORTER + html;
  return html.slice(0, head + 6) + ERROR_REPORTER + html.slice(head + 6);
}

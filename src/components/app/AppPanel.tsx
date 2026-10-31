import React, { useEffect, useRef, useState } from 'react';
import { AppWindow, ChevronDown, Code2, Database, Download, Loader2, MoreHorizontal, RefreshCw, Table2 } from 'lucide-react';
import { useApp, useAppApiBridge, appBundleUrl, withErrorReporter, AppFieldShape } from './useApp';
import { DataAdmin } from './DataAdmin';
import { authenticatedGet } from '@/utils/authenticatedFetch';

type View = 'app' | 'data' | 'schema';

const VIEWS: { key: View; label: string; icon: typeof AppWindow }[] = [
  { key: 'app', label: 'App', icon: AppWindow },
  { key: 'data', label: 'Data', icon: Table2 },
  { key: 'schema', label: 'Schema', icon: Database },
];

interface Props {
  missionId: string | null;
  /** The app's slug, when the stream has already named it. */
  slug?: string | null;
  /** Bumped when the agent publishes a build, so the panel refetches. */
  revisionSignal?: number;
  /** What the agent is doing right now, before anything is built. */
  progress?: string | null;
}

export function AppPanel({ missionId, slug, revisionSignal = 0, progress }: Props) {
  const { app, loading, error, reload } = useApp(missionId, revisionSignal, slug ?? null);
  // Views, not actions. What you look at lives in the dropdown; what you
  // do lives behind the ⋯. Mixing them means the menu you open to inspect
  // something also contains the one that deletes it.
  const [view, setView] = useState<View>('app');
  const [menuOpen, setMenuOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [crash, setCrash] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useAppApiBridge(app?.slug ?? null, frame);

  useEffect(() => {
    // The app telling us it threw. Without this the panel shows a white
    // rectangle and the reason is only in the console.
    const onError = (event: MessageEvent) => {
      if (event.data?.channel !== 'talosy-app-error') return;
      if (event.source !== frame.current?.contentWindow) return;
      setCrash(String(event.data.error));
    };
    window.addEventListener('message', onError);
    return () => window.removeEventListener('message', onError);
  }, []);

  useEffect(() => {
    // Fetched rather than linked: the bundle needs the bearer token, and a
    // plain iframe src would arrive unauthenticated and come back a 401.
    let cancelled = false;
    if (!app?.built || !app.slug) {
      setHtml(null);
      return;
    }
    (async () => {
      const response = await authenticatedGet(appBundleUrl(app.slug));
      if (!cancelled && response.ok) {
        setCrash(null);
        setHtml(withErrorReporter(await response.text()));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app?.slug, app?.built, revisionSignal]);

  if (!app) {
    return (
      <div className="flex h-full min-w-0 flex-col items-center justify-center gap-4 p-8">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="relative inline-flex">
            <AppWindow className="h-5 w-5" />
            {loading && <Loader2 className="absolute -right-1.5 -top-1.5 h-3 w-3 animate-spin" />}
          </span>
          <span className="text-sm font-medium">
            {error ?? progress ?? 'Designing your app…'}
          </span>
        </div>
        <div className="h-64 w-full max-w-2xl animate-pulse rounded-md border border-border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{app.name}</span>
          {!app.built && (
            <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
              not built yet
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <select
              value={view}
              onChange={e => setView(e.target.value as View)}
              aria-label="View"
              className="h-7 appearance-none rounded border border-border bg-background py-0 pl-7 pr-6 text-[11px] text-foreground"
            >
              {VIEWS.map(v => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {React.createElement(VIEWS.find(v => v.key === view)!.icon, { className: 'h-3 w-3' })}
            </span>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="More"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
              className="rounded border border-border p-1.5 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-44 rounded-md border border-border bg-popover py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); void reload(); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <RefreshCw className="h-3 w-3" /> Reload
                  </button>
                  <a
                    href={appBundleUrl(app.slug)}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <Download className="h-3 w-3" /> Download page
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="shrink-0 border-b bg-destructive/10 px-4 py-1.5 text-[11px] text-destructive">
          {error}
        </div>
      )}

      {crash && view === 'app' && (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-[11px] text-destructive">
          <span className="font-medium">This app crashed when it opened.</span>{' '}
          <span className="break-words opacity-90">{crash}</span>
          <span className="mt-1 block opacity-75">
            Ask for a change and it will be rebuilt.
          </span>
        </div>
      )}

      {view === 'data' || view === 'schema' ? (
        // Absolutely positioned, which is the whole fix.
        //
        // A normal flex child is sized by its content: a <table> uses auto
        // layout, treats width:100% as a preference, takes more when its
        // columns want more, and pushes every ancestor outward. An element
        // with `absolute inset-0` is sized by its CONTAINING BLOCK instead
        // — its width comes from the parent and nothing inside can change
        // it. That is exactly why the App view never broke: an <iframe> is
        // a replaced element and already has that property.
        <div className="relative min-h-0 w-full min-w-0 flex-1">
          <div className="absolute inset-0 flex flex-col overflow-hidden">
            {view === 'data' ? (
              <DataAdmin slug={app.slug} spec={app.spec} />
            ) : (
              <SchemaView spec={app.spec} files={app.files} />
            )}
          </div>
        </div>
      ) : html ? (
        <div className="min-h-0 min-w-0 flex-1 bg-white">
          <iframe
            ref={frame}
            title="App preview"
            // allow-scripts WITHOUT allow-same-origin. The app is written by
            // a model and runs here; an opaque origin means it cannot read
            // this app's storage, cookies or DOM, and cannot call the API as
            // the signed-in user. It reaches its own data only by asking the
            // host, which checks every call. allow-forms lets its forms work
            // inside the frame.
            sandbox="allow-scripts allow-forms"
            srcDoc={html}
            className="h-full w-full border-0 bg-white"
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          {app.built ? 'Loading…' : progress ?? 'The app has not been built yet.'}
        </div>
      )}
    </div>
  );
}

function SchemaView({ spec, files }: { spec: Parameters<typeof Object.keys>[0] & any; files: string[] }) {
  const models = spec?.models ?? [];
  const pages = spec?.pages ?? [];
  return (
    <div className="h-full w-full min-w-0 overflow-auto p-4">
      {models.map((model: any) => (
        <section key={model.name} className="mb-5">
          <h3 className="mb-1.5 text-sm font-medium">
            {model.display_name}
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">{model.name}</span>
          </h3>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-[12px]">
              <tbody>
                {(model.fields ?? []).map((field: AppFieldShape) => (
                  <tr key={field.name} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5 font-mono">{field.name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {field.type === 'enum'
                        ? (field.enum_values ?? []).join(' | ')
                        : field.type === 'reference'
                        ? `→ ${field.references_model}`
                        : field.type}
                    </td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">
                      {field.required ? 'required' : ''}
                      {model.display_field === field.name ? ' · title' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {pages.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-1.5 text-sm font-medium">Pages</h3>
          <ul className="space-y-1 text-[12px]">
            {pages.map((page: any) => (
              <li key={page.route} className="flex gap-2">
                <code className="shrink-0 text-muted-foreground">{page.route}</code>
                <span>{page.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {files.length > 0 && (
        <section>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Code2 className="h-3.5 w-3.5" /> Source
          </h3>
          <ul className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
            {files.map(path => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

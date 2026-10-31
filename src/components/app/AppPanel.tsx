import React, { useEffect, useRef, useState } from 'react';
import { AppWindow, Code2, Database, Eye, Loader2, RefreshCw } from 'lucide-react';
import { useApp, useAppApiBridge, appBundleUrl, withErrorReporter, AppFieldShape } from './useApp';
import { authenticatedGet } from '@/utils/authenticatedFetch';

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
  const [view, setView] = useState<'preview' | 'schema'>('preview');
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
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{app.name}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {app.models} model{app.models === 1 ? '' : 's'} · {app.pages} page
            {app.pages === 1 ? '' : 's'}
          </span>
          {!app.built && (
            <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
              not built yet
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-md border border-border p-0.5">
            {([
              ['preview', Eye, 'App'],
              ['schema', Database, 'Data'],
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                aria-pressed={view === key}
                className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors ${
                  view === key
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded border border-border p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Reload the app"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 border-b bg-destructive/10 px-4 py-1.5 text-[11px] text-destructive">
          {error}
        </div>
      )}

      {crash && view === 'preview' && (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-[11px] text-destructive">
          <span className="font-medium">This app crashed when it opened.</span>{' '}
          <span className="break-words opacity-90">{crash}</span>
          <span className="mt-1 block opacity-75">
            Ask for a change and it will be rebuilt.
          </span>
        </div>
      )}

      {view === 'schema' ? (
        <SchemaView spec={app.spec} files={app.files} />
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
    <div className="min-h-0 min-w-0 flex-1 overflow-auto p-4">
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

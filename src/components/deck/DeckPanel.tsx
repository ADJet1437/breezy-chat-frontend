import React, { useEffect, useState } from 'react';
import { Check, Code2, Copy, Download, Images, Loader2, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';
import { SlideImage } from './SlideImage';
import { useDeck, useDeckScript } from './useDeck';

interface Props {
  deckId: string | null;
  /** Bumped when the agent commits a revision, so the panel refetches. */
  revisionSignal?: number;
  /** Slide count promised while the deck is still being written. */
  expectedSlides?: number;
}

export function DeckPanel({ deckId, revisionSignal = 0, expectedSlides = 0 }: Props) {
  const { deck, loading, error } = useDeck(deckId, revisionSignal);
  const [active, setActive] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<'slides' | 'script'>('slides');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // The script is what actually produced the slides -- reading it is how you
  // find out why one looks the way it does. Loaded only when opened.
  const { script, loading: scriptLoading, error: scriptError } = useDeckScript(
    deckId,
    deck?.revision ?? 0,
    view === 'script' && !!deck
  );

  const copyScript = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script.script);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: 'Could not copy the script', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (deck && active >= deck.slide_count) setActive(0);
  }, [deck, active]);

  const download = async () => {
    if (!deck) return;
    setDownloading(true);
    try {
      // Fetched with auth, then handed to the browser: a plain <a href> would
      // arrive without the bearer token and come back a 401.
      const response = await authenticatedGet(buildApiUrl(deck.export_url));
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const url = URL.createObjectURL(await response.blob());
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = `${deck.title.replace(/[^\w\- ]/g, '') || 'deck'}.pptx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: 'Could not download the deck',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!deck) {
    const placeholders = Math.min(expectedSlides > 0 ? expectedSlides : 3, 8);
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="relative inline-flex">
            <Presentation className="h-5 w-5" />
            {loading && (
              <Loader2 className="absolute -right-1.5 -top-1.5 h-3 w-3 animate-spin" />
            )}
          </span>
          <span className="text-sm font-medium">
            {error ?? 'Writing your deck…'}
          </span>
        </div>
        {/* 16:9 placeholders, so the layout does not jump when slides land. */}
        <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: placeholders }).map((_, i) => (
            <div
              key={i}
              className="aspect-video animate-pulse rounded-md border border-border bg-muted/50"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{deck.title}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {deck.slide_count} slides · r{deck.revision}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-md border border-border p-0.5">
            {([
              ['slides', Images, 'Slides'],
              ['script', Code2, 'Script'],
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
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1.5 text-xs"
            onClick={download}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            .pptx
          </Button>
        </div>
      </div>

      {view === 'script' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b bg-muted/20 px-4 py-1.5 text-[11px] text-muted-foreground">
            <span>
              python-pptx · revision {script?.revision ?? deck.revision}
              {script?.author === 'user' ? ' · edited by hand' : ''}
            </span>
            {script && (
              <button
                type="button"
                onClick={copyScript}
                className="ml-auto flex items-center gap-1 transition-colors hover:text-foreground"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-muted/10 p-4">
            {scriptLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading the script…
              </div>
            )}
            {scriptError && (
              <p className="text-xs text-muted-foreground">{scriptError}</p>
            )}
            {script && (
              <pre className="whitespace-pre font-mono text-[12px] leading-relaxed text-foreground/90">
                {script.script}
              </pre>
            )}
          </div>
        </div>
      )}

      {view === 'slides' && (
      <>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/20 p-5">
        <SlideImage
          deckId={deck.id}
          index={active}
          revision={deck.revision}
          alt={`Slide ${active + 1} of ${deck.slide_count}`}
          className="max-h-full max-w-full rounded-md shadow-lg ring-1 ring-border"
        />
      </div>

      <div className="flex w-full shrink-0 gap-2 overflow-x-auto border-t bg-muted/20 p-2">
        {deck.slides.map(slide => (
          <button
            key={slide.index}
            type="button"
            onClick={() => setActive(slide.index)}
            aria-current={slide.index === active}
            className={`shrink-0 overflow-hidden rounded border transition ${
              slide.index === active
                ? 'border-sky-500 ring-1 ring-sky-500'
                : 'border-border hover:border-sky-300'
            }`}
          >
            <SlideImage
              deckId={deck.id}
              index={slide.index}
              revision={deck.revision}
              alt={`Go to slide ${slide.index + 1}`}
              className="block h-[74px] w-[132px] object-cover"
            />
          </button>
        ))}
      </div>
      </>
      )}
    </div>
  );
}

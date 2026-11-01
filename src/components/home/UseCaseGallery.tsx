import React, { useEffect, useState } from 'react';
import { buildApiUrl } from '@/utils/apiConfig';

interface UseCase {
  id: string;
  title: string;
  url: string;
  image_url: string;
  thumb_url: string;
  description?: string;
}

interface Props {
  /** Seeds the composer. Picking a tile starts the work, it does not navigate. */
  onPick: (prompt: string) => void;
}

/** How many tiles the grid shows before the link to the rest. */
const SHOWN = 6;

/**
 * Things built with Talosy, under the composer.
 *
 * This replaced four hand-drawn diagrams of analysis frameworks. The
 * frameworks said what the product could reason about; a picture of a
 * finished site says what it produces, which is the question a first-time
 * visitor is actually asking.
 *
 * Clicking a tile seeds the composer rather than opening the demo. That
 * keeps the interaction the frameworks had and is the point of the
 * section: the picture earns the attention, and the click spends it on
 * starting something rather than on leaving for a new tab. The demo is
 * still reachable, from its own small link.
 *
 * Thumbnails, not screenshots: the originals are 728KB each and six of
 * them would be four megabytes before the page became interactive. The
 * backend derives thumb_url from image_url; these are 17KB.
 */
export const UseCaseGallery: React.FC<Props> = ({ onPick }) => {
  const [useCases, setUseCases] = useState<UseCase[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(buildApiUrl('/api/v1/use-cases/'));
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (!cancelled) setUseCases(data);
      } catch {
        // A home page that cannot reach the gallery still has its composer,
        // which is the thing people came for. Render nothing, say nothing.
        if (!cancelled) setUseCases([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Null while loading and empty on failure both render nothing: a row of
  // grey rectangles that may never fill is worse than the section arriving
  // a moment late.
  if (!useCases?.length) return null;

  const shown = useCases.slice(0, SHOWN);

  return (
    <section aria-labelledby="gallery-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="gallery-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Built with Talosy
        </h2>
        {useCases.length > shown.length && (
          <a
            href="/use-cases"
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            See all {useCases.length}
          </a>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(useCase => (
          <li key={useCase.id} className="group min-w-0">
            {/* The tile is the button and the demo link sits on top of it,
                rather than the link being nested inside -- an anchor inside
                a button is invalid, and browsers resolve it by eating one of
                the two clicks. */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted/40 transition-colors group-hover:border-muted-foreground/40">
              <img
                src={useCase.thumb_url || useCase.image_url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <button
                type="button"
                onClick={() => onPick(`Build me something like ${useCase.title}: `)}
                aria-label={`Build something like ${useCase.title}`}
                className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {/* Shown on hover, and on keyboard focus -- otherwise it is
                  reachable by tab and invisible while you are on it. */}
              <a
                href={useCase.url}
                target="_blank"
                rel="noreferrer noopener"
                className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2.5 py-1 text-[11px] text-foreground opacity-0 backdrop-blur transition-opacity focus:opacity-100 group-hover:opacity-100"
              >
                Open demo ↗
              </a>
            </div>
            <p className="mt-2 truncate text-[13px] text-foreground">
              {useCase.title}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

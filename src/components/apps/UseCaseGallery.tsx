import React, { useEffect, useState } from 'react';
import { buildApiUrl } from '@/utils/apiConfig';

interface UseCase {
  id: string;
  title: string;
  url: string;
  image_url: string;
  description?: string;
}

interface Props {
  /** What picking a tile should do. The page sends it straight to a new
   *  chat; there is no composer here to seed. */
  onPick: (prompt: string) => void;
  /** Cap the grid. Unset shows everything, which is what the page wants. */
  limit?: number;
}

/**
 * Things built with Talosy.
 *
 * Lives on the Apps page rather than under the home composer: the home
 * page's job is to get a sentence typed, and a wall of finished work there
 * competes with the one control that matters. Here it is the content.
 *
 * Clicking a tile starts a chat to build something like it, rather than
 * opening the demo. The picture earns the attention and the click spends
 * it on starting something; the demo is still reachable from its own small
 * link.
 *
 * The screenshots are the full-size originals -- 728KB each, median --
 * because the thumbnails were reverted rather than deploy a rebuilt
 * use-case image. loading="lazy" is therefore load-bearing here, not a
 * nicety: it is the only thing keeping the page from pulling every one of
 * them at once. Restoring thumb_url is the fix if this page ever feels
 * slow.
 */
export const UseCaseGallery: React.FC<Props> = ({ onPick, limit }) => {
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

  const shown = limit ? useCases.slice(0, limit) : useCases;

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
                src={useCase.image_url}
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

import React, { useEffect, useState } from 'react';
import { authenticatedGet } from '@/utils/authenticatedFetch';
import { slideSrc } from './useDeck';

interface Props {
  deckId: string;
  index: number;
  revision: number;
  className?: string;
  alt: string;
}

/**
 * One rendered slide.
 *
 * Fetched as a blob rather than set as an `<img src>`: the slide endpoint is
 * behind the same auth as the deck, and a bare img tag sends no Authorization
 * header, so every slide would 401. The object URL is revoked on unmount --
 * a deck panel left open across a dozen revisions otherwise leaks every
 * image it has ever shown.
 */
export function SlideImage({ deckId, index, revision, className, alt }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const response = await authenticatedGet(slideSrc(deckId, index, revision));
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!revoked) setFailed(true);
      }
    })();

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [deckId, index, revision]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className ?? ''}`}>
        slide {index + 1}
      </div>
    );
  }

  if (!src) {
    return <div className={`animate-pulse bg-muted ${className ?? ''}`} />;
  }

  return <img src={src} alt={alt} className={className} />;
}

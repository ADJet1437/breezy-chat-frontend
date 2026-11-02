import React, { useRef, useState } from 'react';
import Layout from '../components/Layout';
import { LoginDialog } from '../components/login';
import { HomeComposer } from '../components/chat/HomeComposer';
import { UseCaseGallery } from '../components/apps/UseCaseGallery';
import { useStartTask } from '../hooks/useStartTask';

/**
 * Apps: a composer, then everything built with Talosy.
 *
 * The same shape as the home page, because it is the same job -- the
 * gallery is the starter list here, where the thinking models are there.
 * A grid with no way to act on it would send people back to the home page
 * to type the thing they just decided to build.
 */
const Apps: React.FC = () => {
  const { startTask, loginDialog } = useStartTask();
  const [seed, setSeed] = useState<string | undefined>(undefined);
  const composerRef = useRef<HTMLDivElement>(null);

  // Picking a tile fills the composer rather than sending, exactly as the
  // thinking models do on the home page: the prompt is a stem, and only
  // the user knows what they actually want built. Sending immediately
  // would commit them to someone else's sentence.
  const pick = (prompt: string) => {
    setSeed(prompt);
    composerRef.current?.querySelector('textarea')?.focus();
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Layout>
      {/* Dropped well below the top. The page starts at the top rather
          than centring, because the grid is long -- but with only a little
          padding the composer sat almost against the header, which reads
          as cramped next to the home page where it floats in the middle of
          the screen. */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 sm:px-6 sm:pt-40">
        <div ref={composerRef} className="scroll-mt-6">
          <HomeComposer
            onSubmit={startTask}
            seed={seed}
            placeholder="Describe the app you want built…"
          />
        </div>

        <div className="mt-10">
          <UseCaseGallery onPick={pick} />
        </div>
      </div>

      <LoginDialog {...loginDialog} />
    </Layout>
  );
};

export default Apps;

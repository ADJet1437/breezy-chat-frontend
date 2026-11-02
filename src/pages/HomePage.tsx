import React, { useRef, useState } from 'react';
import { LoginDialog } from '../components/login';
import { useStartTask } from '../hooks/useStartTask';
import Layout from '../components/Layout';
import { HomeComposer } from '../components/chat/HomeComposer';
import { ThinkingModels } from '../components/home/ThinkingModels';

/**
 * The landing page: composer, then the thinking-model starters.
 *
 * What used to be here -- a parallax hero, five marketing sections, a header
 * and a footer -- is gone along with those components. Someone arriving here
 * is here to type something.
 */
const HomePage: React.FC = () => {
  const { startTask, loginDialog } = useStartTask();
  const [seed, setSeed] = useState<string | undefined>(undefined);
  const composerRef = useRef<HTMLDivElement>(null);

  // Picking a framework prefills the composer rather than sending: the prompt
  // is a stem ("Run a SWOT analysis on: ") and only the user knows the subject.
  const handlePickModel = (prompt: string) => {
    setSeed(prompt);
    composerRef.current?.querySelector('textarea')?.focus();
  };

  return (
    <Layout>
      {/* Centred with auto margins rather than justify-center. Both centre
          when the content fits; only this one stays reachable when it does
          not. justify-center distributes negative free space symmetrically,
          so on a phone the composer sat 160px above the top of the viewport
          at scroll position zero -- off screen, and unreachable, because
          scrolling only goes down. Auto margins resolve to zero when there
          is no free space, so the content simply starts at the top. */}
      <div className="flex min-h-full flex-col items-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="my-auto w-full max-w-3xl space-y-8 sm:space-y-10">
          <div ref={composerRef}>
            <HomeComposer onSubmit={startTask} seed={seed} />
          </div>

          <ThinkingModels onPick={handlePickModel} />
        </div>
      </div>


      <LoginDialog {...loginDialog} />
    </Layout>
  );
};

export default HomePage;

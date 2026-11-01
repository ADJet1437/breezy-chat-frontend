import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { UseCaseGallery } from '../components/apps/UseCaseGallery';

/**
 * What Talosy has built, and a way to start one of your own.
 *
 * The gallery sat under the home composer first. It competed there: the
 * home page's job is to get a sentence typed, and a wall of finished work
 * beside the one control that matters pulls against it. On a page of its
 * own the same grid is the content rather than a distraction, and there is
 * room to show all of them instead of six.
 */
const Apps: React.FC = () => {
  const navigate = useNavigate();

  // Straight into a new chat with the prompt already sent -- there is no
  // composer on this page to seed, and a tile that merely filled in a box
  // somewhere else would be a worse version of the home page.
  const start = (prompt: string) =>
    navigate('/chat', { state: { initialMessage: prompt } });

  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Apps
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Things built with Talosy. Pick one to start something like it.
          </p>
        </header>

        <UseCaseGallery onPick={start} />
      </div>
    </Layout>
  );
};

export default Apps;

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UploadedFile } from '../components/FileUpload';
import { useAuth } from '../contexts/AuthContext';
import { LoginDialog } from '../components/login';
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
  const navigate = useNavigate();
  const { isAuthenticated, accessToken } = useAuth();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);
  // Names and sizes, not only ids: the first message has to show the
  // file the moment it is sent, and ids cannot be drawn.
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [seed, setSeed] = useState<string | undefined>(undefined);
  const composerRef = useRef<HTMLDivElement>(null);

  // A message typed before signing in is held here and sent once auth lands,
  // so logging in does not cost the user what they already wrote.
  useEffect(() => {
    if (isAuthenticated && accessToken && pendingMessage) {
      navigate('/chat', {
        state: {
          initialMessage: pendingMessage,
          initialFileIds: pendingFileIds,
          initialFiles: pendingFiles,
        },
      });
      setPendingMessage(null);
      setPendingFileIds([]);
      setPendingFiles([]);
    }
  }, [isAuthenticated, accessToken, pendingMessage, pendingFileIds, navigate]);

  const handleLoginDialogChange = (open: boolean) => {
    setShowLoginDialog(open);

    if (!open) {
      // Let the auth state settle before deciding the user cancelled.
      setTimeout(() => {
        if (!isAuthenticated && pendingMessage) {
          setPendingMessage(null);
          setPendingFileIds([]);
        }
      }, 100);
    }
  };

  const handleCreateTask = async (
    message: string,
    fileIds: string[],
    files: UploadedFile[]
  ) => {
    if (!isAuthenticated || !accessToken) {
      setPendingMessage(message);
      setPendingFileIds(fileIds);
      setPendingFiles(files);
      setShowLoginDialog(true);
      return;
    }

    navigate('/chat', {
      state: { initialMessage: message, initialFileIds: fileIds, initialFiles: files },
    });
  };

  // Picking a framework prefills the composer rather than sending: the prompt
  // is a stem ("Run a SWOT analysis on: ") and only the user knows the subject.
  const handlePickModel = (prompt: string) => {
    setSeed(prompt);
    composerRef.current?.querySelector('textarea')?.focus();
  };

  return (
    <Layout>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl space-y-10">
          <div ref={composerRef}>
            <HomeComposer onSubmit={handleCreateTask} seed={seed} />
          </div>

          <ThinkingModels onPick={handlePickModel} />
        </div>
      </div>


      <LoginDialog open={showLoginDialog} onOpenChange={handleLoginDialogChange} />
    </Layout>
  );
};

export default HomePage;

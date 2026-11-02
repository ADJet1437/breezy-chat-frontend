import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { UploadedFile } from '../components/FileUpload';
import { useAuth } from '../contexts/AuthContext';

/**
 * Starting a conversation from a composer that is not in one yet.
 *
 * Extracted from HomePage when the Apps page grew a composer of its own.
 * The navigation is one line; everything around it is the part worth not
 * writing twice -- a message typed before signing in is held and sent once
 * auth lands, so logging in does not cost the user what they already wrote.
 */
export function useStartTask() {
  const navigate = useNavigate();
  const { isAuthenticated, accessToken } = useAuth();

  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);
  // Names and sizes, not only ids: the first message has to show the file
  // the moment it is sent, and ids cannot be drawn.
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);

  const go = (message: string, fileIds: string[], files: UploadedFile[]) =>
    navigate('/chat', {
      state: {
        initialMessage: message,
        initialFileIds: fileIds,
        initialFiles: files,
      },
    });

  useEffect(() => {
    if (isAuthenticated && accessToken && pendingMessage) {
      go(pendingMessage, pendingFileIds, pendingFiles);
      setPendingMessage(null);
      setPendingFileIds([]);
      setPendingFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, pendingMessage, pendingFileIds, navigate]);

  const startTask = async (
    message: string,
    fileIds: string[],
    files: UploadedFile[]
  ) => {
    if (!isAuthenticated || !accessToken) {
      setPendingMessage(message);
      setPendingFileIds(fileIds);
      setPendingFiles(files);
      setLoginOpen(true);
      return;
    }
    go(message, fileIds, files);
  };

  const onLoginDialogChange = (open: boolean) => {
    setLoginOpen(open);
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

  return {
    startTask,
    loginDialog: { open: loginOpen, onOpenChange: onLoginDialogChange },
  };
}

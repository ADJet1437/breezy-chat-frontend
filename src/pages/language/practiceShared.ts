import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { T } from './config';
import { fetchScript, type PracticeScript } from './practiceApi';

export type ScenarioDraft = {
  description: string;
  topic?: string;
  language: string;
  nativeLanguage: string;
};

export const inputStyle = {
  backgroundColor: T.panel,
  color: T.text,
  borderColor: T.border,
} as const;

/**
 * Resolve the script for a /language/practice/:scriptId route: prefer the one
 * passed via router state (no refetch when navigating within the app), fall
 * back to fetching by ID so the URL survives refresh and sharing.
 */
export function useRouteScript(): { script: PracticeScript | null; scriptId: string; error: string } {
  const { scriptId = '' } = useParams();
  const location = useLocation();
  const stateScript = (location.state as { script?: PracticeScript } | null)?.script;
  const initial = stateScript && stateScript.script_id === scriptId ? stateScript : null;

  const [script, setScript] = useState<PracticeScript | null>(initial);
  const [error, setError] = useState('');

  useEffect(() => {
    if (script?.script_id === scriptId || !scriptId) return;
    setScript(null);
    fetchScript(scriptId)
      .then(setScript)
      .catch(() => setError('Could not load this scenario.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId]);

  return { script, scriptId, error };
}

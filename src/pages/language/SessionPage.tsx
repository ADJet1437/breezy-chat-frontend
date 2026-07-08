import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { T } from './config';
import { disposeEngine, getEngine } from './engineStore';
import { saveRun } from './practiceApi';
import { PracticePlayer } from './PracticePlayer';
import { useRouteScript } from './practiceShared';

export function SessionPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { script, scriptId, error: loadError } = useRouteScript();

  // Engine is live when arriving from the preview's "Start practicing";
  // on a direct visit/refresh we gate on a click so mic init is a user gesture.
  const [engineReady, setEngineReady] = useState(() => getEngine().ready);
  const [micError, setMicError] = useState('');

  useEffect(() => {
    return () => disposeEngine(); // release the microphone when leaving
  }, []);

  async function enableMic() {
    setMicError('');
    try {
      await getEngine().init();
      setEngineReady(true);
    } catch {
      setMicError('Microphone access is required to practice.');
    }
  }

  if (!script) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3" style={{ backgroundColor: T.bg }}>
        {loadError
          ? <p className="text-sm" style={{ color: T.red }}>{loadError}</p>
          : <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: T.purple, borderTopColor: 'transparent' }} />}
      </div>
    );
  }

  if (!engineReady) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6" style={{ backgroundColor: T.bg }}>
        <div className="w-full max-w-sm flex flex-col items-center gap-5 rounded-2xl border p-8"
          style={{ backgroundColor: T.panel, borderColor: T.border }}>
          <span className="text-3xl">🎙</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base font-bold text-center" style={{ color: T.text }}>{script.title}</span>
            <span className="text-sm text-center" style={{ color: T.muted }}>
              You'll speak your lines out loud — we need your microphone.
            </span>
          </div>
          {micError && <p className="text-sm" style={{ color: T.red }}>{micError}</p>}
          <button onClick={enableMic}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: T.gradient }}>
            Start practicing
          </button>
          <button onClick={() => navigate(`/language/practice/${scriptId}`)}
            className="text-sm" style={{ color: T.muted }}>
            back to preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <PracticePlayer
      script={script}
      engine={getEngine()}
      onFinish={(stats) => {
        saveRun(script.script_id, {
          passed: stats.filter((t) => t.passed).length,
          total: stats.length,
          stats,
        }, accessToken).catch(() => { /* history is best-effort */ });
        navigate(`/language/practice/${script.script_id}/summary`, { state: { script, stats } });
      }}
      onExit={() => navigate(`/language/practice/${script.script_id}`, { state: { script } })}
    />
  );
}

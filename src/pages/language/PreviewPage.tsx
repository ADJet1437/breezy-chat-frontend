import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { T } from './config';
import { getEngine } from './engineStore';
import { fetchTts, generateScript } from './practiceApi';
import { useRouteScript } from './practiceShared';

export function PreviewPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { script, error: loadError } = useRouteScript();

  const [showTranslations, setShowTranslations] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  async function playLine(index: number, text: string) {
    if (playing !== null) return;
    setPlaying(index);
    try {
      const buf = await fetchTts(text);
      const blob = new Blob([buf], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setPlaying(null); };
      await audio.play();
    } catch {
      setPlaying(null);
    }
  }

  async function regenerate() {
    if (!script || regenerating) return;
    setRegenerating(true);
    setError('');
    try {
      const fresh = await generateScript({
        description: script.description,
        language: script.language,
        native_language: script.native_language,
        exchanges: script.turns.filter((t) => t.role === 'user').length,
        topic: script.topic ?? undefined,
        focus: script.focus ?? undefined,
        sentence_length: script.sentence_length,
      }, accessToken);
      navigate(`/language/practice/${fresh.script_id}`, { state: { script: fresh }, replace: true });
    } catch {
      setError('Could not regenerate the conversation.');
    } finally {
      setRegenerating(false);
    }
  }

  async function startPracticing() {
    if (!script) return;
    // Init mic + AudioContext inside the click gesture (mobile Safari/Chrome)
    try {
      await getEngine().init();
    } catch {
      setError('Microphone access is required to practice.');
      return;
    }
    navigate(`/language/practice/${script.script_id}/session`, { state: { script } });
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center" style={{ backgroundColor: T.bg }}>
      <div className="w-full max-w-2xl flex flex-col min-h-[calc(100vh-4rem)] border-x" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b" style={{ borderColor: T.border }}>
          <button onClick={() => navigate('/language/practice/new')} className="text-2xl font-light leading-none mr-1" style={{ color: T.purple }}>‹</button>
          <span className="text-base font-bold truncate" style={{ color: T.text }}>{script.title}</span>
          <button
            onClick={() => setShowTranslations((v) => !v)}
            className="text-xs ml-auto shrink-0 px-2 py-1 rounded-full border"
            style={{ color: showTranslations ? T.purpleSoft : T.muted, borderColor: T.border }}
          >
            translations
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
          {script.turns.map((t) => (
            t.role === 'user' ? (
              <div key={t.index} className="max-w-[80%] rounded-2xl px-3 py-2.5 self-end flex flex-col gap-1"
                style={{ backgroundColor: T.chip, border: `1px dashed ${T.purpleDim}` }}>
                <span className="text-sm leading-relaxed" style={{ color: T.purpleSoft }}>{t.text}</span>
                {showTranslations && <span className="text-xs" style={{ color: T.faint }}>{t.translation}</span>}
              </div>
            ) : (
              <div key={t.index} className="self-start flex flex-col gap-1 max-w-[85%]">
                <div className="flex items-start gap-2">
                  <button onClick={() => playLine(t.index, t.text)} className="mt-0.5 shrink-0"
                    style={{ color: playing === t.index ? T.purple : T.purpleDim }}>
                    {playing === t.index
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>}
                  </button>
                  <p className="text-sm leading-relaxed" style={{ color: T.text }}>{t.text}</p>
                </div>
                {showTranslations && <p className="text-xs leading-relaxed ml-6" style={{ color: T.faint }}>{t.translation}</p>}
              </div>
            )
          ))}
        </div>

        {error && <p className="text-sm px-5 pb-2" style={{ color: T.red }}>{error}</p>}

        <div className="shrink-0 flex gap-3 px-5 py-4 border-t" style={{ borderColor: T.border }}>
          <button onClick={regenerate} disabled={regenerating}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold border disabled:opacity-60"
            style={{ color: T.purpleSoft, borderColor: T.purpleDim, backgroundColor: 'transparent' }}>
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button onClick={startPracticing} className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: T.gradient }}>
            Start practicing
          </button>
        </div>
      </div>
    </div>
  );
}

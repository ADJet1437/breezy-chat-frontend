import { useCallback, useEffect, useRef, useState } from 'react';

import { T } from './config';
import { attemptTurn, fetchTts, type AttemptResult, type PracticeScript } from './practiceApi';
import { RECORDER_FILENAME, type Recording, type SpeechEngine } from './speechEngine';

export type TurnStats = {
  index: number;
  text: string;
  translation: string;
  tries: number;
  bestScore: number;
  passed: boolean;
  skipped: boolean;
};

type Phase = 'ai_speaking' | 'listening' | 'processing' | 'feedback';
type DoneMessage = { role: 'ai' | 'user'; text: string; translation: string; skipped?: boolean };

const PHASE_LABEL: Record<Phase, { color: string; label: string }> = {
  ai_speaking: { color: T.green, label: 'Partner speaking…' },
  listening: { color: T.purple, label: 'Your turn — speak the line' },
  processing: { color: T.orange, label: 'Checking…' },
  feedback: { color: T.orange, label: 'Almost — try again' },
};

type Props = {
  script: PracticeScript;
  engine: SpeechEngine;
  onFinish: (stats: TurnStats[]) => void;
  onExit: () => void;
};

export function PracticePlayer({ script, engine, onFinish, onExit }: Props) {
  const turns = script.turns;
  const [turnIdx, setTurnIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('ai_speaking');
  const [messages, setMessages] = useState<DoneMessage[]>([]);
  const [feedback, setFeedback] = useState<AttemptResult | null>(null);
  const [tries, setTries] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [hearSpeed, setHearSpeed] = useState(1.0);
  const [hearPlaying, setHearPlaying] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // 0..1

  const statsRef = useRef<Map<number, TurnStats>>(new Map());
  const recordingRef = useRef<Recording | null>(null);
  const aliveRef = useRef(true);
  const triesRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userTurnCount = turns.filter((t) => t.role === 'user').length;
  const userTurnsDone = turns.slice(0, turnIdx).filter((t) => t.role === 'user').length;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      recordingRef.current?.cancel();
      engine.stopPlayback();
    };
  }, [engine]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 80);
  }, [messages, turnIdx, feedback]);

  const recordStat = useCallback((index: number, patch: Partial<TurnStats>) => {
    const turn = turns[index];
    const prev = statsRef.current.get(index) ?? {
      index, text: turn.text, translation: turn.translation,
      tries: 0, bestScore: 0, passed: false, skipped: false,
    };
    statsRef.current.set(index, { ...prev, ...patch, tries: patch.tries ?? prev.tries });
  }, [turns]);

  const advance = useCallback(() => {
    setFeedback(null);
    setTries(0);
    triesRef.current = 0;
    setShowTranslation(false);
    setMicLevel(0);
    setTurnIdx((i) => i + 1);
  }, []);

  const startListening = useCallback(async (index: number) => {
    setPhase('listening');
    setFeedback(null);
    const rec = engine.recordUntilSilence((db) => {
      // Map -60..0 dB onto 0..1 for the level bar
      setMicLevel(Math.max(0, Math.min(1, (db + 60) / 60)));
    });
    recordingRef.current = rec;
    const b64 = await rec.promise;
    recordingRef.current = null;
    if (!aliveRef.current) return;
    if (b64 === null) return; // cancelled (hear-it, skip, unmount) — caller restarts if needed

    setPhase('processing');
    setMicLevel(0);
    try {
      const result = await attemptTurn(script.script_id, index, b64, RECORDER_FILENAME);
      if (!aliveRef.current) return;
      const nextTries = triesRef.current + 1;
      triesRef.current = nextTries;
      setTries(nextTries);
      const best = Math.max(statsRef.current.get(index)?.bestScore ?? 0, result.score);
      if (result.result === 'pass') {
        recordStat(index, { tries: nextTries, bestScore: best, passed: true });
        const turn = turns[index];
        setMessages((m) => [...m, { role: 'user', text: turn.text, translation: turn.translation }]);
        advance();
      } else {
        recordStat(index, { tries: nextTries, bestScore: best });
        setFeedback(result);
        setPhase('feedback');
      }
    } catch {
      if (!aliveRef.current) return;
      // Network/transcription hiccup — go back to listening rather than dead-ending
      startListening(index);
    }
  }, [engine, script.script_id, turns, advance, recordStat]);

  // Drive the script: each turn index runs its side of the conversation
  useEffect(() => {
    if (turnIdx >= turns.length) {
      onFinish(Array.from(statsRef.current.values()).sort((a, b) => a.index - b.index));
      return;
    }
    const turn = turns[turnIdx];
    if (turn.role === 'ai') {
      setPhase('ai_speaking');
      setMessages((m) => [...m, { role: 'ai', text: turn.text, translation: turn.translation }]);
      (async () => {
        try {
          const buf = await fetchTts(turn.text);
          if (!aliveRef.current) return;
          await engine.playMp3(buf);
        } catch { /* audio failure shouldn't block the script */ }
        if (aliveRef.current) advance();
      })();
    } else {
      startListening(turnIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIdx]);

  async function hearIt() {
    if (hearPlaying) return;
    const turn = turns[turnIdx];
    const wasListening = phase === 'listening';
    recordingRef.current?.cancel();
    setHearPlaying(true);
    try {
      const buf = await fetchTts(turn.text, hearSpeed);
      if (aliveRef.current) await engine.playMp3(buf);
    } catch { /* ignore */ }
    setHearPlaying(false);
    if (aliveRef.current && wasListening) startListening(turnIdx);
  }

  function skipTurn() {
    recordingRef.current?.cancel();
    const turn = turns[turnIdx];
    recordStat(turnIdx, { tries: triesRef.current, skipped: true });
    setMessages((m) => [...m, { role: 'user', text: turn.text, translation: turn.translation, skipped: true }]);
    advance();
  }

  const currentTurn = turnIdx < turns.length ? turns[turnIdx] : null;
  const isUserTurn = currentTurn?.role === 'user';
  const cfg = PHASE_LABEL[phase];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center" style={{ backgroundColor: T.bg }}>
      <div className="w-full max-w-2xl flex flex-col h-full border-x" style={{ borderColor: T.border }}>

        {/* Header with progress */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-2">
            <button onClick={onExit} className="text-2xl font-light leading-none mr-1" style={{ color: T.purple }}>‹</button>
            <span className="text-base font-bold truncate" style={{ color: T.text }}>{script.title}</span>
            <span className="text-xs ml-auto shrink-0" style={{ color: T.muted }}>
              {userTurnsDone}/{userTurnCount} lines
            </span>
          </div>
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: T.chip }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ backgroundColor: T.purple, width: `${(userTurnsDone / userTurnCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Conversation so far */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="max-w-[80%] rounded-2xl px-3 py-2.5 self-end"
                style={{ backgroundColor: m.skipped ? T.chip : T.purple, border: m.skipped ? `1px dashed ${T.purpleDim}` : 'none' }}>
                <span className="text-sm leading-relaxed" style={{ color: m.skipped ? T.muted : '#fff' }}>
                  {m.skipped ? `(skipped) ${m.text}` : m.text}
                </span>
              </div>
            ) : (
              <div key={i} className="self-start flex flex-col gap-1 max-w-[85%]">
                <p className="text-sm leading-relaxed" style={{ color: T.text }}>{m.text}</p>
                <p className="text-xs leading-relaxed" style={{ color: T.faint }}>{m.translation}</p>
              </div>
            )
          ))}

          {/* Prompt card: the line the user must say next */}
          {isUserTurn && currentTurn && (
            <div className="self-end flex flex-col items-end gap-1 mt-2 max-w-[90%]">
              <span className="text-xs font-medium" style={{ color: T.muted }}>your line</span>
              <div className="flex flex-col gap-2 px-4 py-3 rounded-2xl rounded-tr-sm"
                style={{ backgroundColor: T.chip, border: `1px dashed ${T.purpleDim}` }}>
                <p className="text-sm leading-relaxed" style={{ color: T.purpleSoft }}>
                  {feedback
                    ? feedback.word_diffs.map((wd, i) => (
                        <span key={i} style={{
                          color: wd.matched ? T.purpleSoft : T.red,
                          textDecoration: wd.matched ? 'none' : 'underline',
                        }}>{wd.word}{' '}</span>
                      ))
                    : currentTurn.text}
                </p>
                {showTranslation
                  ? <p className="text-xs leading-relaxed" style={{ color: T.faint }}>{currentTurn.translation}</p>
                  : <button onClick={() => setShowTranslation(true)} className="text-xs self-start" style={{ color: T.purpleDim }}>
                      show translation
                    </button>}
                <div className="flex items-center gap-2">
                  <button onClick={hearIt} className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: hearPlaying ? T.purple : T.purpleDim }}>
                    {hearPlaying
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>}
                    hear it
                  </button>
                  <select
                    value={hearSpeed}
                    onChange={(e) => setHearSpeed(Number(e.target.value))}
                    className="text-xs font-bold outline-none cursor-pointer appearance-none bg-transparent"
                    style={{ color: hearSpeed < 1 ? T.purpleSoft : T.purpleDim }}
                  >
                    <option value={1.0}>1x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={0.5}>0.5x</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Attempt feedback */}
          {feedback && (
            <div className="self-end flex flex-col items-end gap-2 mt-1 max-w-[90%]">
              <div className="rounded-xl px-4 py-3 border flex flex-col gap-2" style={{ backgroundColor: T.panel, borderColor: T.border }}>
                <span className="text-xs" style={{ color: T.muted }}>
                  We heard: <span style={{ color: T.text }}>{feedback.transcript || '(nothing clear)'}</span>
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => startListening(turnIdx)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: T.purple }}>
                    Try again
                  </button>
                  {tries >= 2 && (
                    <button onClick={skipTurn} className="text-xs font-semibold" style={{ color: T.muted }}>
                      skip this line
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status footer with mic level */}
        <div className="shrink-0 px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: T.border }}>
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{
            backgroundColor: cfg.color,
            animation: phase === 'listening' ? 'pulse 1.2s ease-in-out infinite' : 'none',
          }} />
          <span className="text-sm font-semibold" style={{ color: T.text }}>{cfg.label}</span>
          {phase === 'listening' && (
            <div className="flex-1 h-1.5 rounded-full overflow-hidden ml-2" style={{ backgroundColor: T.chip }}>
              <div className="h-full rounded-full transition-all duration-100"
                style={{ backgroundColor: T.purple, width: `${Math.round(micLevel * 100)}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const _HTTP_BASE = import.meta.env.VITE_TALOSY_BACKEND_HOST || 'http://localhost:8000';
const BASE_URL = `${_HTTP_BASE}/api/v1`;
const WS_BASE = `${_HTTP_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws')}/api/v1`;
const SPEECH_THRESHOLD_DB = -25;
const SILENCE_MS = 1800;
const VAD_INTERVAL_MS = 100;
const INTERRUPT_THRESHOLD_DB = -25;
const INTERRUPT_SUSTAINED_MS = 250;
const INTERRUPT_SILENCE_RESET_MS = 150;
const TEXT_STREAM_MS_PER_WORD = 50;

const RECORDER_MIME = (() => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
})();

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'setup' | 'conversation' | 'summary';
type AppState = 'connecting' | 'ai_speaking' | 'listening' | 'processing' | 'paused' | 'ended';
type Message = { role: 'user' | 'ai'; text: string };
type SessionSummary = {
  exchanges: number;
  nailed: string[];
  nailed_type: 'sentences' | 'words';
  covered_topics: string[];
};

// ─── API ──────────────────────────────────────────────────────────────────────

async function createSession(language: string, nativeLanguage: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/talkos/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, native_language: nativeLanguage }),
  });
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
  const data = await res.json();
  return data.session_id;
}

// ─── Language options ─────────────────────────────────────────────────────────

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Swedish', 'Japanese', 'Mandarin', 'Korean', 'Italian', 'Portuguese'];

// ─── State indicator ──────────────────────────────────────────────────────────

const STATE_CONFIG: Record<AppState, { color: string; icon: string; label: string; spin: boolean }> = {
  connecting:  { color: '#2a2a4a', icon: '',   label: 'Connecting…',  spin: true },
  ai_speaking: { color: '#44aa88', icon: '🔊', label: 'Speaking…',    spin: false },
  listening:   { color: '#7c6af7', icon: '🎙', label: 'Listening…',   spin: false },
  processing:  { color: '#f0a040', icon: '',   label: 'Processing…',  spin: true },
  paused:      { color: '#f0a040', icon: '⏸', label: 'Paused',        spin: false },
  ended:       { color: '#2a2a4a', icon: '✓',  label: 'Session ended', spin: false },
};

function StateIndicator({ appState }: { appState: AppState }) {
  const cfg = STATE_CONFIG[appState];
  const pulse = appState === 'listening' || appState === 'ai_speaking';
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative flex items-center justify-center w-[72px] h-[72px]">
        {pulse && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ backgroundColor: cfg.color }} />
        )}
        <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color }}>
          {cfg.spin
            ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <span className="text-2xl">{cfg.icon}</span>
          }
        </div>
      </div>
      <span className="text-base font-semibold tracking-wide" style={{ color: '#e0e0ff' }}>{cfg.label}</span>
    </div>
  );
}

// ─── Summary view ─────────────────────────────────────────────────────────────

function SummaryView({ summary, onAgain }: { summary: SessionSummary; onAgain: () => void }) {
  const nailedLabel = summary.nailed_type === 'words' ? 'You nailed these words' : 'You nailed these';
  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
      <div className="flex gap-4 mt-2 mb-2">
        <div className="rounded-2xl p-5 flex flex-col items-center min-w-[110px] border" style={{ backgroundColor: '#16213e', borderColor: '#2a2a4a' }}>
          <span className="text-4xl font-black" style={{ color: '#7c6af7' }}>{summary.exchanges}</span>
          <span className="text-xs mt-1" style={{ color: '#8888aa' }}>exchanges</span>
        </div>
      </div>

      {summary.covered_topics.length > 0 && (
        <div className="w-full flex flex-wrap gap-2">
          {summary.covered_topics.map((topic, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#1e1e3e', color: '#7c6af7', border: '1px solid #2a2a4a' }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {summary.nailed.length > 0 && (
        <div className="w-full rounded-xl p-4 border flex flex-col gap-2.5" style={{ backgroundColor: '#16213e', borderColor: '#2a2a4a' }}>
          <span className="text-sm font-bold" style={{ color: '#44aa88' }}>🎉 {nailedLabel}</span>
          {summary.nailed.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: '#44aa88' }}>✓</span>
              <span className="text-sm leading-relaxed" style={{ color: '#e0e0ff' }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAgain}
        className="mt-4 mb-8 px-12 py-4 rounded-full text-base font-bold text-white"
        style={{ backgroundColor: '#7c6af7' }}
      >
        Practice Again
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoTalkosV1() {
  const [view, setView] = useState<View>('setup');
  const [language, setLanguage] = useState('English');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [appState, setAppState] = useState<AppState>('connecting');
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [streamingText, setStreamingText] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpokenRef = useRef(false);
  const isActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const submitCalledRef = useRef(false);
  const currentAudioRef = useRef<{ source: AudioBufferSourceNode } | null>(null);
  const interruptVadRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interruptSpeechStartRef = useRef<number | null>(null);
  const interruptSilenceStartRef = useRef<number | null>(null);
  const streamingFullTextRef = useRef('');
  const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addMessage = useCallback((role: 'user' | 'ai', text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 80);
  }, []);

  const flushStreaming = useCallback(() => {
    if (streamingIntervalRef.current) { clearInterval(streamingIntervalRef.current); streamingIntervalRef.current = null; }
    if (streamingFullTextRef.current) {
      addMessage('ai', streamingFullTextRef.current);
      streamingFullTextRef.current = '';
    }
    setStreamingText('');
  }, [addMessage]);

  const stopVad = useCallback(() => {
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  }, []);

  const stopInterruptVad = useCallback(() => {
    if (interruptVadRef.current) { clearInterval(interruptVadRef.current); interruptVadRef.current = null; }
    interruptSpeechStartRef.current = null;
    interruptSilenceStartRef.current = null;
  }, []);

  const enterListening = useCallback(async () => {
    hasSpokenRef.current = false;
    submitCalledRef.current = false;
    stopVad();

    try {
      const stream = streamRef.current;
      if (!stream) { console.error('[MIC] no stream — mic not acquired'); return; }

      if (!analyserRef.current) { console.error('[MIC] no analyser — AudioContext not ready'); return; }

      audioChunksRef.current = [];
      const mr = RECORDER_MIME
        ? new MediaRecorder(stream, { mimeType: RECORDER_MIME })
        : new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      isActiveRef.current = true;
      setAppState('listening');

      const dataArray = new Float32Array(analyserRef.current!.fftSize);
      vadIntervalRef.current = setInterval(() => {
        if (!isActiveRef.current) { stopVad(); return; }
        analyserRef.current!.getFloatTimeDomainData(dataArray);
        const rms = Math.sqrt(dataArray.reduce((s, v) => s + v * v, 0) / dataArray.length);
        const db = rms > 0 ? 20 * Math.log10(rms) : -100;

        if (db > SPEECH_THRESHOLD_DB) {
          hasSpokenRef.current = true;
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        } else if (hasSpokenRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => { silenceTimerRef.current = null; triggerSubmit(); }, SILENCE_MS);
        }
      }, VAD_INTERVAL_MS);
    } catch (e) {
      console.error('[MIC] error:', e);
    }
  }, [stopVad]);

  function startTextStream(text: string) {
    if (streamingIntervalRef.current) { clearInterval(streamingIntervalRef.current); streamingIntervalRef.current = null; }
    streamingFullTextRef.current = text;
    setStreamingText('');
    const words = text.split(' ');
    let wordIdx = 0;
    streamingIntervalRef.current = setInterval(() => {
      wordIdx++;
      setStreamingText(words.slice(0, wordIdx).join(' '));
      if (wordIdx >= words.length) { clearInterval(streamingIntervalRef.current!); streamingIntervalRef.current = null; }
    }, TEXT_STREAM_MS_PER_WORD);
  }

  const playAudio = useCallback(async (base64Mp3: string, onFinish: () => void) => {
    isActiveRef.current = false;
    stopVad();
    stopInterruptVad();
    const ctx = audioContextRef.current;
    if (!ctx) { onFinish(); return; }
    try {
      const binary = atob(base64Mp3);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* ok */ } }
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      const bufSource = ctx.createBufferSource();
      bufSource.buffer = audioBuffer;
      bufSource.connect(ctx.destination);
      const entry = { source: bufSource };
      currentAudioRef.current = entry;
      bufSource.onended = () => {
        if (currentAudioRef.current !== entry) return;
        currentAudioRef.current = null;
        stopInterruptVad();
        setTimeout(onFinish, 400);
      };
      bufSource.start();

      // Monitor mic while AI speaks; sustained voice above threshold triggers an interrupt
      if (analyserRef.current) {
        const iData = new Float32Array(analyserRef.current.fftSize);
        interruptVadRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getFloatTimeDomainData(iData);
          const rms = Math.sqrt(iData.reduce((s, v) => s + v * v, 0) / iData.length);
          const db = rms > 0 ? 20 * Math.log10(rms) : -100;
          if (db > INTERRUPT_THRESHOLD_DB) {
            interruptSilenceStartRef.current = null;
            if (interruptSpeechStartRef.current === null) {
              interruptSpeechStartRef.current = Date.now();
            } else if (Date.now() - interruptSpeechStartRef.current >= INTERRUPT_SUSTAINED_MS) {
              stopInterruptVad();
              flushStreaming();
              if (currentAudioRef.current) {
                const interrupted = currentAudioRef.current;
                currentAudioRef.current = null;
                try { interrupted.source.stop(); } catch { /* already ended */ }
              }
              enterListening();
            }
          } else {
            if (interruptSilenceStartRef.current === null) {
              interruptSilenceStartRef.current = Date.now();
            } else if (Date.now() - interruptSilenceStartRef.current >= INTERRUPT_SILENCE_RESET_MS) {
              interruptSpeechStartRef.current = null;
              interruptSilenceStartRef.current = null;
            }
          }
        }, VAD_INTERVAL_MS);
      }
    } catch {
      currentAudioRef.current = null;
      stopInterruptVad();
      onFinish();
    }
  }, [stopVad, stopInterruptVad, enterListening, flushStreaming]);

  function triggerSubmit() {
    if (!isActiveRef.current || submitCalledRef.current) return;
    submitCalledRef.current = true;
    isActiveRef.current = false;
    stopVad();
    submitSpeech();
  }

  async function submitSpeech() {
    setAppState('processing');
    const mr = mediaRecorderRef.current;
    if (!mr) { enterListening(); return; }

    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      mr.stop();
    });

    const blob = new Blob(audioChunksRef.current, { type: RECORDER_MIME || 'audio/webm' });
    if (blob.size < 500) { enterListening(); return; }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      wsRef.current?.send(JSON.stringify({ type: 'speech', data: base64 }));
    };
    reader.readAsDataURL(blob);
  }

  const startSession = useCallback(async () => {
    setView('conversation');
    setMessages([]);
    setSummary(null);
    setAppState('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      // Create and unlock AudioContext during user gesture — required for Safari + Chrome mobile
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new AudioCtx();
      try { await ctx.resume(); } catch { /* ok */ }
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      alert('Microphone access is required. Please allow the permission and try again.');
      setView('setup');
      return;
    }

    let sessionId: string;
    try {
      sessionId = await createSession(language, nativeLanguage);
    } catch {
      alert('Could not connect to server. Is the backend running?');
      setView('setup');
      return;
    }

    const wsParams = new URLSearchParams({ language, native_language: nativeLanguage });
    const ws = new WebSocket(`${WS_BASE}/talkos/ws/${sessionId}?${wsParams}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      let msg: any;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case 'ready':
          if (msg.opening_audio) {
            startTextStream(msg.opening_text);
            setAppState('ai_speaking');
            playAudio(msg.opening_audio, () => {
              addMessage('ai', msg.opening_text);
              setStreamingText('');
              streamingFullTextRef.current = '';
              if (!isPausedRef.current) enterListening();
            });
          } else {
            addMessage('ai', msg.opening_text);
            enterListening();
          }
          break;
        case 'transcript':
          addMessage('user', msg.text);
          break;
        case 'ai_response':
          startTextStream(msg.text);
          setAppState('ai_speaking');
          playAudio(msg.audio, () => {
            addMessage('ai', msg.text);
            setStreamingText('');
            streamingFullTextRef.current = '';
            if (!isPausedRef.current) enterListening(); else setAppState('paused');
          });
          break;
        case 'no_speech':
          if (!isPausedRef.current) enterListening();
          break;
        case 'session_end':
          setSummary(msg.summary);
          break;
        case 'error':
          alert(`Error: ${msg.message}`);
          setView('setup');
          break;
      }
    };

    ws.onerror = () => { alert('Connection error'); setView('setup'); };
    ws.onclose = () => { if (!isPausedRef.current) console.warn('[WS] closed'); };
  }, [language, nativeLanguage, addMessage, playAudio, enterListening]);

  function handlePause() {
    isPausedRef.current = true;
    isActiveRef.current = false;
    stopVad();
    stopInterruptVad();
    flushStreaming();
    mediaRecorderRef.current?.stop();
    if (currentAudioRef.current) {
      const entry = currentAudioRef.current;
      currentAudioRef.current = null;
      try { entry.source.stop(); } catch { /* already ended */ }
    }
    setAppState('paused');
  }

  function handleResume() {
    isPausedRef.current = false;
    enterListening();
  }

  function handleEnd() {
    isActiveRef.current = false;
    isPausedRef.current = false;
    stopVad();
    stopInterruptVad();
    flushStreaming();
    mediaRecorderRef.current?.stop();
    if (currentAudioRef.current) {
      const entry = currentAudioRef.current;
      currentAudioRef.current = null;
      try { entry.source.stop(); } catch { /* already ended */ }
    }
    setSummary(null);
    setView('summary');
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }));
    }
  }

  useEffect(() => {
    return () => {
      stopVad();
      stopInterruptVad();
      if (streamingIntervalRef.current) { clearInterval(streamingIntervalRef.current); }
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, [stopVad, stopInterruptVad]);

  useEffect(() => {
    if (streamingText) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [streamingText]);

  const pauseActive = appState === 'listening' || appState === 'ai_speaking' || appState === 'processing' || appState === 'paused';

  // ── Setup view ────────────────────────────────────────────────────────────

  if (view === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl">🗣️</span>
            <h1 className="text-3xl font-black" style={{ color: '#e0e0ff' }}>Talkos</h1>
            <p className="text-sm text-center" style={{ color: '#8888aa' }}>AI language partner — speak to learn</p>
          </div>

          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: '#8888aa' }}>I WANT TO PRACTICE</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium border outline-none"
                style={{ backgroundColor: '#16213e', color: '#e0e0ff', borderColor: '#2a2a4a' }}
              >
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: '#8888aa' }}>I SPEAK</label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium border outline-none"
                style={{ backgroundColor: '#16213e', color: '#e0e0ff', borderColor: '#2a2a4a' }}
              >
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full py-4 rounded-2xl text-base font-bold text-white transition-opacity hover:opacity-90 active:opacity-75"
            style={{ backgroundColor: '#7c6af7' }}
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }

  // ── Summary view ──────────────────────────────────────────────────────────

  if (view === 'summary') {
    return (
      <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="w-full max-w-2xl flex flex-col min-h-screen border-x" style={{ borderColor: '#2a2a4a' }}>
          <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b" style={{ borderColor: '#2a2a4a' }}>
            <span className="text-lg font-black" style={{ color: '#e0e0ff' }}>Session Summary</span>
          </div>
          {summary
            ? <SummaryView summary={summary} onAgain={() => setView('setup')} />
            : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7c6af7', borderTopColor: 'transparent' }} />
                <span className="text-sm" style={{ color: '#8888aa' }}>Generating your review…</span>
              </div>
            )
          }
        </div>
      </div>
    );
  }

  // ── Conversation view ─────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col items-center" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="w-full max-w-2xl flex flex-col h-full border-x" style={{ borderColor: '#2a2a4a' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b shrink-0" style={{ borderColor: '#2a2a4a' }}>
          <button onClick={() => setView('setup')} className="text-2xl font-light leading-none mr-1" style={{ color: '#7c6af7' }}>‹</button>
          <span className="text-base font-bold" style={{ color: '#e0e0ff' }}>Talkos</span>
          <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#16213e', color: '#8888aa' }}>
            {language}
          </span>
        </div>

        {/* State indicator */}
        <StateIndicator appState={appState} />

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2.5">
          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div
                key={i}
                className="max-w-[80%] rounded-2xl px-3 py-2.5 self-end"
                style={{ backgroundColor: '#7c6af7' }}
              >
                <span className="text-sm leading-relaxed" style={{ color: '#fff' }}>{m.text}</span>
              </div>
            ) : (
              <p key={i} className="self-start text-sm leading-relaxed" style={{ color: '#e0e0ff' }}>{m.text}</p>
            )
          ))}
          {streamingText && (
            <p className="self-start text-sm leading-relaxed" style={{ color: '#e0e0ff' }}>{streamingText}</p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex justify-evenly items-center px-8 py-5 border-t" style={{ borderColor: '#2a2a4a' }}>
          <button
            onClick={appState === 'paused' ? handleResume : handlePause}
            disabled={!pauseActive}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl transition-opacity"
            style={{
              backgroundColor: pauseActive ? '#7c6af7' : '#16213e',
              border: pauseActive ? 'none' : '1.5px solid #2a2a4a',
              opacity: pauseActive ? 1 : 0.5,
            }}
          >
            {appState === 'paused' ? '▶' : '⏸'}
          </button>

          <button
            onClick={handleEnd}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl border"
            style={{ backgroundColor: '#16213e', borderColor: '#3a2a2a', color: '#e0e0ff' }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const SPEECH_THRESHOLD_DB = -25;
const SILENCE_MS = 1800;
const VAD_INTERVAL_MS = 100;
const MAX_RECORDING_MS = 20000;
const MIN_BLOB_BYTES = 500;

const RECORDER_MIME = (() => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
})();

export const RECORDER_FILENAME = RECORDER_MIME.includes('mp4') ? 'speech.mp4' : 'speech.webm';

export type Recording = {
  /** Resolves with base64 audio, or null if cancelled / too short. */
  promise: Promise<string | null>;
  cancel: () => void;
};

/**
 * Owns the microphone stream, AudioContext, VAD recording, and MP3 playback
 * for a practice session. `init()` must be called from a user gesture
 * (click handler) so mobile Safari/Chrome unlock the AudioContext.
 */
export class SpeechEngine {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;

  get ready(): boolean {
    return this.stream !== null && this.analyser !== null;
  }

  async init(): Promise<void> {
    if (this.ready) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    this.ctx = new AudioCtx();
    try { await this.ctx.resume(); } catch { /* ok */ }
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    src.connect(this.analyser);
  }

  /** Play MP3 bytes; resolves when playback finishes or is stopped. */
  async playMp3(mp3: ArrayBuffer): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    this.stopPlayback();
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* ok */ } }
    const audioBuffer = await ctx.decodeAudioData(mp3.slice(0));
    return new Promise<void>((resolve) => {
      const bufSource = ctx.createBufferSource();
      bufSource.buffer = audioBuffer;
      bufSource.connect(ctx.destination);
      bufSource.onended = () => {
        if (this.source === bufSource) this.source = null;
        resolve();
      };
      this.source = bufSource;
      bufSource.start();
    });
  }

  stopPlayback(): void {
    if (this.source) {
      const s = this.source;
      this.source = null;
      try { s.stop(); } catch { /* already ended */ }
    }
  }

  /**
   * Record until the speaker goes silent (energy VAD). Resolves with base64
   * audio once SILENCE_MS of quiet follows speech, or null on cancel/noise.
   */
  recordUntilSilence(onLevel?: (db: number) => void): Recording {
    let settled = false;
    let vadInterval: ReturnType<typeof setInterval> | null = null;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let maxTimer: ReturnType<typeof setTimeout> | null = null;
    let recorder: MediaRecorder | null = null;
    const chunks: Blob[] = [];
    let resolveFn: (v: string | null) => void;

    const promise = new Promise<string | null>((resolve) => { resolveFn = resolve; });

    const cleanup = () => {
      if (vadInterval) { clearInterval(vadInterval); vadInterval = null; }
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      if (maxTimer) { clearTimeout(maxTimer); maxTimer = null; }
    };

    const finish = async () => {
      if (settled) return;
      settled = true;
      cleanup();
      const mr = recorder;
      if (!mr) { resolveFn(null); return; }
      await new Promise<void>((r) => {
        mr.onstop = () => r();
        try { mr.stop(); } catch { r(); }
      });
      const blob = new Blob(chunks, { type: RECORDER_MIME || 'audio/webm' });
      if (blob.size < MIN_BLOB_BYTES) { resolveFn(null); return; }
      const reader = new FileReader();
      reader.onloadend = () => resolveFn((reader.result as string).split(',')[1] ?? null);
      reader.onerror = () => resolveFn(null);
      reader.readAsDataURL(blob);
    };

    const cancel = () => {
      if (settled) return;
      settled = true;
      cleanup();
      try { recorder?.stop(); } catch { /* ok */ }
      resolveFn(null);
    };

    if (!this.stream || !this.analyser) {
      settled = true;
      resolveFn!(null);
      return { promise, cancel };
    }

    recorder = RECORDER_MIME
      ? new MediaRecorder(this.stream, { mimeType: RECORDER_MIME })
      : new MediaRecorder(this.stream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start();

    let hasSpoken = false;
    const dataArray = new Float32Array(this.analyser.fftSize);
    vadInterval = setInterval(() => {
      if (!this.analyser) return;
      this.analyser.getFloatTimeDomainData(dataArray);
      const rms = Math.sqrt(dataArray.reduce((s, v) => s + v * v, 0) / dataArray.length);
      const db = rms > 0 ? 20 * Math.log10(rms) : -100;
      onLevel?.(db);
      if (db > SPEECH_THRESHOLD_DB) {
        hasSpoken = true;
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      } else if (hasSpoken && !silenceTimer) {
        silenceTimer = setTimeout(finish, SILENCE_MS);
      }
    }, VAD_INTERVAL_MS);
    maxTimer = setTimeout(finish, MAX_RECORDING_MS);

    return { promise, cancel };
  }

  dispose(): void {
    this.stopPlayback();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
  }
}

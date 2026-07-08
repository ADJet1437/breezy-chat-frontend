import { BASE_URL } from './config';

export type ScriptTurn = {
  index: number;
  role: 'ai' | 'user';
  text: string;
  translation: string;
};

export type SentenceLength = 'short' | 'medium' | 'long';

export type PracticeScript = {
  script_id: string;
  title: string;
  description: string;
  topic?: string | null;
  focus?: string | null;
  sentence_length: SentenceLength;
  language: string;
  native_language: string;
  turns: ScriptTurn[];
};

export type WordDiff = { word: string; matched: boolean };

export type AttemptResult = {
  transcript: string;
  score: number;
  result: 'pass' | 'close' | 'miss';
  word_diffs: WordDiff[];
};

export type GenerateScriptRequest = {
  description: string;
  language: string;
  native_language: string;
  exchanges: number;
  topic?: string;
  focus?: string;
  sentence_length?: SentenceLength;
};

export type HistoryItem = {
  script_id: string;
  title: string;
  description: string;
  language: string;
  native_language: string;
  created_at: string;
  run_count: number;
  best_passed: number | null;
  total_lines: number;
  last_run_at: string | null;
};

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function generateScript(
  req: GenerateScriptRequest,
  token?: string | null,
): Promise<PracticeScript> {
  const res = await fetch(`${BASE_URL}/talkos/scripted-practice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Script generation failed: ${res.status}`);
  return res.json();
}

export async function fetchScript(scriptId: string): Promise<PracticeScript> {
  const res = await fetch(`${BASE_URL}/talkos/scripted-practice/${scriptId}`);
  if (!res.ok) throw new Error(`Failed to fetch script: ${res.status}`);
  return res.json();
}

export async function listScripts(token: string): Promise<HistoryItem[]> {
  const res = await fetch(`${BASE_URL}/talkos/scripted-practice`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to list scripts: ${res.status}`);
  return res.json();
}

export async function saveRun(
  scriptId: string,
  run: { passed: number; total: number; stats: unknown[] },
  token?: string | null,
): Promise<void> {
  await fetch(`${BASE_URL}/talkos/scripted-practice/${scriptId}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(run),
  });
}

export async function fetchPracticePdf(
  scriptId: string,
  opts: { includeTranslations: boolean; includeSpeakers: boolean },
): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/talkos/scripted-practice/${scriptId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      include_translations: opts.includeTranslations,
      include_speakers: opts.includeSpeakers,
    }),
  });
  if (!res.ok) throw new Error(`PDF export failed: ${res.status}`);
  return res.blob();
}

export async function deleteScript(scriptId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/talkos/scripted-practice/${scriptId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 404) throw new Error(`Delete failed: ${res.status}`);
}

export async function attemptTurn(
  scriptId: string,
  turnIndex: number,
  audioBase64: string,
  filename: string,
): Promise<AttemptResult> {
  const res = await fetch(`${BASE_URL}/talkos/scripted-practice/${scriptId}/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turn_index: turnIndex, audio_base64: audioBase64, filename }),
  });
  if (!res.ok) throw new Error(`Attempt failed: ${res.status}`);
  return res.json();
}

const ttsCache = new Map<string, ArrayBuffer>();

export async function fetchTts(text: string, speed = 1.0): Promise<ArrayBuffer> {
  const key = `${speed}|${text}`;
  const cached = ttsCache.get(key);
  if (cached) return cached;
  const res = await fetch(`${BASE_URL}/talkos/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speed }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  ttsCache.set(key, buffer);
  return buffer;
}

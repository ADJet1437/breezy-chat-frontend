import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { LANGUAGES, T } from './config';
import { generateScript, type SentenceLength } from './practiceApi';
import { inputStyle, type ScenarioDraft } from './practiceShared';

const LENGTH_OPTIONS: { value: SentenceLength; label: string; hint: string }[] = [
  { value: 'short', label: 'Short', hint: '≤ 12 words' },
  { value: 'medium', label: 'Medium', hint: '10–18 words' },
  { value: 'long', label: 'Long', hint: '18–28 words' },
];

/** Grow the textarea with its content instead of showing a scrollbar. */
function autoGrow(e: FormEvent<HTMLTextAreaElement>) {
  const el = e.currentTarget;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function CreateScenarioPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();
  const draft = (location.state as { draft?: ScenarioDraft } | null)?.draft;

  const [description, setDescription] = useState(draft?.description ?? '');
  const [topic, setTopic] = useState(draft?.topic ?? '');
  const [exchanges, setExchanges] = useState(5);
  const [language, setLanguage] = useState(draft?.language ?? 'Swedish');
  const [nativeLanguage, setNativeLanguage] = useState(draft?.nativeLanguage ?? 'English');
  const [focusActions, setFocusActions] = useState('');
  const [focusEmotions, setFocusEmotions] = useState('');
  const [focusTerms, setFocusTerms] = useState('');
  const [sentenceLength, setSentenceLength] = useState<SentenceLength>('short');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (description.trim().length < 3) {
      setError('Describe the situation you want to practice.');
      return;
    }
    setError('');
    setGenerating(true);
    const focusParts = [
      focusActions.trim() && `Actions: ${focusActions.trim()}`,
      focusEmotions.trim() && `Emotions: ${focusEmotions.trim()}`,
      focusTerms.trim() && `Terms: ${focusTerms.trim()}`,
    ].filter(Boolean);
    try {
      const script = await generateScript({
        description: description.trim(),
        language,
        native_language: nativeLanguage,
        exchanges,
        topic: topic.trim() || undefined,
        focus: focusParts.length ? focusParts.join('; ') : undefined,
        sentence_length: sentenceLength,
      }, accessToken);
      navigate(`/language/practice/${script.script_id}`, { state: { script } });
    } catch {
      setError('Could not generate the conversation. Is the backend running?');
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6" style={{ backgroundColor: T.bg }}>
      <div className="w-full max-w-md flex flex-col gap-6">
        <button onClick={() => navigate('/language')} className="text-sm self-start" style={{ color: T.purpleDim }}>‹ free talk</button>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: T.muted }}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Returning a broken phone to the store and asking for a refund"
              rows={3}
              disabled={generating}
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold" style={{ color: T.muted }}>EXCHANGES</label>
              <div className="flex items-center rounded-xl border" style={inputStyle}>
                <button disabled={generating || exchanges <= 3} onClick={() => setExchanges((n) => n - 1)}
                  className="px-4 py-3 text-lg font-bold" style={{ color: T.purple }}>−</button>
                <span className="flex-1 text-center text-sm font-bold" style={{ color: T.text }}>{exchanges}</span>
                <button disabled={generating || exchanges >= 20} onClick={() => setExchanges((n) => n + 1)}
                  className="px-4 py-3 text-lg font-bold" style={{ color: T.purple }}>+</button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-[2]">
              <label className="text-xs font-semibold" style={{ color: T.muted }}>TOPIC (OPTIONAL)</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. shopping"
                disabled={generating}
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold" style={{ color: T.muted }}>I WANT TO PRACTICE</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={generating}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium border outline-none" style={inputStyle}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold" style={{ color: T.muted }}>I SPEAK</label>
              <select value={nativeLanguage} onChange={(e) => setNativeLanguage(e.target.value)} disabled={generating}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium border outline-none" style={inputStyle}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Advanced options */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-semibold self-start flex items-center gap-1.5"
            style={{ color: T.purpleSoft }}
          >
            <span className="inline-block transition-transform" style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none' }}>›</span>
            Advanced options
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-4 rounded-2xl border p-4" style={{ borderColor: T.border, backgroundColor: T.panel }}>
              <span className="text-xs font-semibold" style={{ color: T.text }}>I want to learn…</span>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: T.muted }}>ACTIONS (OPTIONAL)</label>
                <textarea
                  value={focusActions}
                  onChange={(e) => setFocusActions(e.target.value)}
                  onInput={autoGrow}
                  placeholder="e.g. ordering food, asking for the bill, making a complaint"
                  rows={1}
                  disabled={generating}
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none overflow-hidden"
                  style={{ ...inputStyle, backgroundColor: T.bg }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: T.muted }}>EMOTIONS (OPTIONAL)</label>
                <textarea
                  value={focusEmotions}
                  onChange={(e) => setFocusEmotions(e.target.value)}
                  onInput={autoGrow}
                  placeholder="e.g. expressing gratitude, polite frustration, excitement"
                  rows={1}
                  disabled={generating}
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none overflow-hidden"
                  style={{ ...inputStyle, backgroundColor: T.bg }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: T.muted }}>TERMS & WORDS (OPTIONAL)</label>
                <textarea
                  value={focusTerms}
                  onChange={(e) => setFocusTerms(e.target.value)}
                  onInput={autoGrow}
                  placeholder="e.g. 'kvitto', 'byta rum', numbers and prices"
                  rows={1}
                  disabled={generating}
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none overflow-hidden"
                  style={{ ...inputStyle, backgroundColor: T.bg }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: T.muted }}>SENTENCE LENGTH</label>
                <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                  {LENGTH_OPTIONS.map((opt) => {
                    const active = sentenceLength === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSentenceLength(opt.value)}
                        disabled={generating}
                        className="flex-1 py-2.5 flex flex-col items-center gap-0.5"
                        style={{
                          backgroundColor: active ? T.chip : T.bg,
                          borderLeft: opt.value !== 'short' ? `1px solid ${T.border}` : 'none',
                        }}
                      >
                        <span className="text-sm font-bold" style={{ color: active ? T.purple : T.muted }}>{opt.label}</span>
                        <span className="text-[10px]" style={{ color: active ? T.purpleSoft : T.faint }}>{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm" style={{ color: T.red }}>{error}</p>}

        <button
          onClick={generate}
          disabled={generating}
          className="w-full py-4 rounded-2xl text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: T.gradient }}
        >
          {generating
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Writing your conversation…
              </span>
            : 'Generate conversation'}
        </button>
      </div>
    </div>
  );
}

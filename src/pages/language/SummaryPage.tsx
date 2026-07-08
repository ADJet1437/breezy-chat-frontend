import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { T } from './config';
import { fetchPracticePdf, type PracticeScript } from './practiceApi';
import type { TurnStats } from './PracticePlayer';

export function SummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scriptId = '' } = useParams();
  const { isAuthenticated } = useAuth();

  const state = (location.state ?? {}) as { script?: PracticeScript; stats?: TurnStats[] };
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfTranslations, setPdfTranslations] = useState(false);
  const [pdfSpeakers, setPdfSpeakers] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // The summary only exists right after a run — without stats (direct visit,
  // refresh) send the user to the script preview instead.
  if (!state.stats || !state.script) {
    return <Navigate to={`/language/practice/${scriptId}`} replace />;
  }
  const { script, stats } = state as { script: PracticeScript; stats: TurnStats[] };
  const passed = stats.filter((s) => s.passed).length;

  async function downloadPdf() {
    if (pdfBusy) return;
    setPdfBusy(true);
    setPdfError('');
    try {
      const blob = await fetchPracticePdf(script.script_id, {
        includeTranslations: pdfTranslations,
        includeSpeakers: pdfSpeakers,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talosy-practice-${script.title.toLowerCase().replace(/[^a-z0-9åäö]+/gi, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setPdfDialogOpen(false);
    } catch {
      setPdfError('Could not generate the PDF. Please try again.');
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center" style={{ backgroundColor: T.bg }}>
      <div className="w-full max-w-2xl flex flex-col min-h-[calc(100vh-4rem)] border-x" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b" style={{ borderColor: T.border }}>
          <span className="text-lg font-black" style={{ color: T.text }}>Practice Summary</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
          <div className="rounded-2xl p-5 flex flex-col items-center min-w-[130px] border mt-2"
            style={{ backgroundColor: T.panel, borderColor: T.border }}>
            <span className="text-4xl font-black" style={{ color: T.purple }}>{passed}/{stats.length}</span>
            <span className="text-xs mt-1" style={{ color: T.muted }}>lines nailed</span>
          </div>
          {isAuthenticated && (
            <span className="text-xs" style={{ color: T.faint }}>✓ saved to your practice history</span>
          )}

          <div className="w-full rounded-xl p-4 border flex flex-col gap-3" style={{ backgroundColor: T.panel, borderColor: T.border }}>
            {stats.map((s) => (
              <div key={s.index} className="flex items-start gap-2.5">
                <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: s.passed ? T.green : s.skipped ? T.muted : T.orange }}>
                  {s.passed ? '✓' : s.skipped ? '↷' : '△'}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm leading-relaxed" style={{ color: T.text }}>{s.text}</span>
                  <span className="text-xs" style={{ color: T.faint }}>
                    {s.skipped ? 'skipped' : `${s.tries} ${s.tries === 1 ? 'try' : 'tries'}`}
                    {s.bestScore > 0 && ` · best ${Math.round(s.bestScore * 100)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 w-full mt-4 mb-8">
            <button
              onClick={() => navigate(`/language/practice/${script.script_id}/session`, { state: { script } })}
              className="w-full py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: T.gradient }}>
              Practice again
            </button>
            <button onClick={() => setPdfDialogOpen(true)}
              className="w-full py-3.5 rounded-2xl text-sm font-bold border"
              style={{ color: T.purpleSoft, borderColor: T.purpleDim, backgroundColor: 'transparent' }}>
              Download as PDF
            </button>
            <button onClick={() => navigate('/language/practice/new')}
              className="w-full py-3.5 rounded-2xl text-sm font-bold border"
              style={{ color: T.purpleSoft, borderColor: T.purpleDim, backgroundColor: 'transparent' }}>
              New scenario
            </button>
          </div>
        </div>
      </div>

      <Dialog open={pdfDialogOpen} onOpenChange={(open) => { setPdfDialogOpen(open); if (!open) setPdfError(''); }}>
        <DialogContent
          className="sm:max-w-sm"
          style={{ backgroundColor: T.panel, borderColor: T.border, color: T.text }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: T.text }}>Download conversation</DialogTitle>
            <DialogDescription style={{ color: T.muted }}>
              Choose what to include in your practice PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <label
              className="flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3"
              style={{ borderColor: pdfTranslations ? T.purpleDim : T.border, backgroundColor: pdfTranslations ? T.chip : 'transparent' }}
            >
              <Checkbox
                checked={pdfTranslations}
                onCheckedChange={(v) => setPdfTranslations(v === true)}
                className="border-gray-400 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <span className="text-sm font-medium" style={{ color: T.text }}>Include translations</span>
            </label>
            <label
              className="flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3"
              style={{ borderColor: pdfSpeakers ? T.purpleDim : T.border, backgroundColor: pdfSpeakers ? T.chip : 'transparent' }}
            >
              <Checkbox
                checked={pdfSpeakers}
                onCheckedChange={(v) => setPdfSpeakers(v === true)}
                className="border-gray-400 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <span className="text-sm font-medium" style={{ color: T.text }}>Include speaker names</span>
            </label>
            {pdfError && <p className="text-sm" style={{ color: T.red }}>{pdfError}</p>}
          </div>
          <DialogFooter>
            <button onClick={() => setPdfDialogOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ color: T.muted }}>
              Cancel
            </button>
            <button onClick={downloadPdf} disabled={pdfBusy}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: T.gradient }}>
              {pdfBusy ? 'Preparing…' : 'Download'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

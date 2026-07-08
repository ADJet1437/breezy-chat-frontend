import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from '@/components/login';
import { T } from './config';
import { deleteScript, fetchScript, listScripts, type HistoryItem, type PracticeScript } from './practiceApi';

type Props = {
  onBack: () => void;
  onPractice: (script: PracticeScript) => void;
  onNewVariation: (item: HistoryItem) => void;
  onCreateFirst: () => void;
};

export function HistoryView({ onBack, onPractice, onNewVariation, onCreateFirst }: Props) {
  const { isAuthenticated, accessToken } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) { setLoading(false); return; }
    setLoading(true);
    listScripts(accessToken)
      .then(setItems)
      .catch(() => setError('Could not load your history.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, accessToken]);

  async function handlePractice(item: HistoryItem) {
    setOpening(item.script_id);
    try {
      onPractice(await fetchScript(item.script_id));
    } catch {
      setError('Could not open this scenario.');
      setOpening(null);
    }
  }

  async function handleDelete(item: HistoryItem) {
    if (!accessToken) return;
    setConfirmDelete(null);
    setItems((prev) => prev.filter((i) => i.script_id !== item.script_id));
    deleteScript(item.script_id, accessToken).catch(() => { /* already removed from UI */ });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center" style={{ backgroundColor: T.bg }}>
      <div className="w-full max-w-2xl flex flex-col min-h-[calc(100vh-4rem)] border-x" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b" style={{ borderColor: T.border }}>
          <button onClick={onBack} className="text-2xl font-light leading-none mr-1" style={{ color: T.purple }}>‹</button>
          <span className="text-lg font-black" style={{ color: T.text }}>My Practice</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          {/* Signed out */}
          {!isAuthenticated && (
            <div className="rounded-2xl border p-6 flex flex-col items-center gap-4 mt-8"
              style={{ backgroundColor: T.panel, borderColor: T.border }}>
              <p className="text-sm text-center" style={{ color: T.muted }}>
                Sign in to keep your practice scenarios and results — and pick them up on any device.
              </p>
              <button onClick={() => setShowLogin(true)}
                className="px-8 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: T.gradient }}>
                Sign in
              </button>
            </div>
          )}

          {/* Loading */}
          {isAuthenticated && loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 mt-16">
              <div className="w-7 h-7 border-2 rounded-full animate-spin"
                style={{ borderColor: T.purple, borderTopColor: 'transparent' }} />
              <span className="text-sm" style={{ color: T.muted }}>Loading your history…</span>
            </div>
          )}

          {error && <p className="text-sm" style={{ color: T.red }}>{error}</p>}

          {/* Empty */}
          {isAuthenticated && !loading && !error && items.length === 0 && (
            <div className="rounded-2xl border p-6 flex flex-col items-center gap-4 mt-8"
              style={{ backgroundColor: T.panel, borderColor: T.border }}>
              <p className="text-sm text-center" style={{ color: T.muted }}>
                No practice yet — describe your first scenario and it will show up here.
              </p>
              <button onClick={onCreateFirst}
                className="px-8 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: T.gradient }}>
                Create a scenario
              </button>
            </div>
          )}

          {/* History cards */}
          {items.map((item) => {
            const when = item.last_run_at ?? item.created_at;
            return (
              <div key={item.script_id} className="rounded-2xl border p-4 flex flex-col gap-2.5"
                style={{ backgroundColor: T.panel, borderColor: T.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-bold truncate" style={{ color: T.text }}>{item.title}</span>
                    <span className="text-xs line-clamp-2" style={{ color: T.muted }}>{item.description}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: T.chip, color: T.purple }}>
                    {item.language}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs" style={{ color: T.faint }}>
                  <span>{formatDistanceToNow(new Date(when), { addSuffix: true })}</span>
                  {item.run_count > 0 ? (
                    <span style={{ color: item.best_passed === item.total_lines ? T.green : T.muted }}>
                      ✓ best {item.best_passed ?? 0}/{item.total_lines} · {item.run_count} {item.run_count === 1 ? 'run' : 'runs'}
                    </span>
                  ) : (
                    <span>not practiced yet</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handlePractice(item)}
                    disabled={opening !== null}
                    className="px-4 py-2 rounded-full text-xs font-bold text-white disabled:opacity-60"
                    style={{ background: T.gradient }}
                  >
                    {opening === item.script_id ? 'Opening…' : 'Practice again'}
                  </button>
                  <button
                    onClick={() => onNewVariation(item)}
                    className="px-4 py-2 rounded-full text-xs font-bold border"
                    style={{ color: T.purpleSoft, borderColor: T.purpleDim }}
                  >
                    New variation
                  </button>
                  {confirmDelete === item.script_id ? (
                    <span className="ml-auto flex items-center gap-2 text-xs">
                      <button onClick={() => handleDelete(item)} className="font-bold" style={{ color: T.red }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ color: T.muted }}>Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(item.script_id)}
                      className="ml-auto text-xs" style={{ color: T.faint }}>
                      delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </div>
  );
}

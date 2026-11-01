import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { CreditStatus } from '../../hooks/useMessageStreaming';

interface CreditWarningProps {
  status: CreditStatus | null;
}

/**
 * Tells the user they are running low before they start something long.
 *
 * A turn already in flight is never interrupted, which is deliberate -- being
 * cut off between writing a file and building it would leave a half-finished
 * app. The cost of that guarantee is that the last turn can overshoot the
 * plan, so the user has to be told in advance rather than at the refusal. An
 * app build runs to roughly 2,200 credits, so "in advance" means well before
 * zero; the server decides the threshold and sends `warn`.
 *
 * Dismissal is remembered per threshold crossing, not forever: dismissing the
 * 80% notice should not hide the one that says the next turn will fail.
 */
export const CreditWarning = ({ status }: CreditWarningProps) => {
  const [dismissed, setDismissed] = useState<string | null>(null);

  // Keyed on which notice this is, so crossing into "exhausted" re-opens it.
  const key = status ? `${status.plan_name}:${status.exhausted ? 'out' : 'low'}` : null;

  useEffect(() => {
    if (!key) return;
    try {
      setDismissed(localStorage.getItem('credit-warning-dismissed'));
    } catch {
      // Private windows and blocked site data both throw; showing the
      // warning is the safe failure.
      setDismissed(null);
    }
  }, [key]);

  if (!status || !status.warn || !key || dismissed === key) return null;

  const dismiss = () => {
    setDismissed(key);
    try {
      localStorage.setItem('credit-warning-dismissed', key);
    } catch {
      // Dismissal just won't persist across reloads.
    }
  };

  const resetsOn = new Date(status.reset_date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
        status.exhausted
          ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'
          : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {status.exhausted ? (
          <p>
            You've used all {status.limit.toLocaleString()} credits on{' '}
            {status.plan_name}. Your next message won't go through until credits
            reset on {resetsOn}.
          </p>
        ) : (
          <p>
            {status.remaining.toLocaleString()} of{' '}
            {status.limit.toLocaleString()} credits left on {status.plan_name}.
            A full app build uses around 2,000 — worth upgrading before you
            start one.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

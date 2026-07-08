import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Header } from '../../components/layout/Header';
import { T } from './config';
import { CreateScenarioPage } from './CreateScenarioPage';
import FreeTalk from './FreeTalk';
import { HistoryView } from './HistoryView';
import type { HistoryItem } from './practiceApi';
import { PreviewPage } from './PreviewPage';
import { SessionPage } from './SessionPage';
import { SummaryPage } from './SummaryPage';

/** Site header on top; content starts below its fixed 4rem height. */
function LanguageLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ backgroundColor: T.bg }}>
      <Header showNavigation={true} />
      <div className="pt-16">{children}</div>
    </div>
  );
}

// ── /language ── free talk landing ──────────────────────────────────────────
export function LanguageHomePage() {
  const navigate = useNavigate();
  return (
    <LanguageLayout>
      <FreeTalk
        onGuidedPractice={() => navigate('/language/practice/new')}
        onHistory={() => navigate('/language/history')}
      />
    </LanguageLayout>
  );
}

// ── /language/practice/new ── scenario form ─────────────────────────────────
export function PracticeCreatePage() {
  return (
    <LanguageLayout>
      <CreateScenarioPage />
    </LanguageLayout>
  );
}

// ── /language/practice/:scriptId ── script preview ──────────────────────────
export function PracticePreviewPage() {
  return (
    <LanguageLayout>
      <PreviewPage />
    </LanguageLayout>
  );
}

// ── /language/practice/:scriptId/session ── live practice ───────────────────
export function PracticeSessionPage() {
  return (
    <LanguageLayout>
      <SessionPage />
    </LanguageLayout>
  );
}

// ── /language/practice/:scriptId/summary ── run results ─────────────────────
export function PracticeSummaryPage() {
  return (
    <LanguageLayout>
      <SummaryPage />
    </LanguageLayout>
  );
}

// ── /language/history ───────────────────────────────────────────────────────
export function LanguageHistoryPage() {
  const navigate = useNavigate();
  return (
    <LanguageLayout>
      <HistoryView
        onBack={() => navigate('/language')}
        onPractice={(script) => navigate(`/language/practice/${script.script_id}`, { state: { script } })}
        onNewVariation={(item: HistoryItem) =>
          navigate('/language/practice/new', {
            state: {
              draft: {
                description: item.description,
                language: item.language,
                nativeLanguage: item.native_language,
              },
            },
          })
        }
        onCreateFirst={() => navigate('/language/practice/new')}
      />
    </LanguageLayout>
  );
}

export default LanguageHomePage;

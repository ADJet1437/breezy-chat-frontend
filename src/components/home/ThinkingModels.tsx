import React from 'react';

/**
 * The four starter frameworks under the composer.
 *
 * Each card carries a small diagram of its own shape rather than an icon --
 * the picture is what tells you what the framework does before you read the
 * caption. They are drawn with divs and one inline SVG, so they inherit the
 * theme and cost nothing to load.
 */

interface ModelCardProps {
  name: string;
  kind: string;
  caption: string;
  onPick: (prompt: string) => void;
  prompt: string;
  children: React.ReactNode;
}

const ModelCard: React.FC<ModelCardProps> = ({ name, kind, caption, onPick, prompt, children }) => (
  <button
    type="button"
    onClick={() => onPick(prompt)}
    className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-5 text-left transition-colors hover:border-muted-foreground/30 hover:bg-card/70"
  >
    <div className="flex items-baseline gap-2">
      <span className="text-[15px] font-semibold tracking-tight text-foreground">{name}</span>
      <span className="text-sm text-muted-foreground">{kind}</span>
    </div>

    <div className="flex min-h-[86px] flex-1 items-center">{children}</div>

    <p className="text-[13px] leading-relaxed text-muted-foreground">{caption}</p>
  </button>
);

const SmartDiagram = () => (
  <div className="w-full">
    <div className="mb-2 flex items-center justify-between px-0.5">
      {['S', 'M', 'A', 'R', 'T'].map(letter => (
        <span key={letter} className="text-sm font-semibold text-foreground">
          {letter}
        </span>
      ))}
    </div>
    {/* track with four filled stops and one open, i.e. in progress */}
    <div className="relative mb-3 flex items-center justify-between px-1">
      <div className="absolute left-2 right-2 h-px bg-border" />
      {[true, true, true, true, false].map((filled, i) => (
        <span
          key={i}
          className={`relative h-2.5 w-2.5 rounded-full ${
            filled ? 'bg-blue-500' : 'border border-blue-500 bg-card'
          }`}
        />
      ))}
    </div>
    <div className="h-1 w-full rounded-full bg-muted">
      <div className="h-1 w-3/4 rounded-full bg-blue-500" />
    </div>
  </div>
);

const SwotDiagram = () => (
  <div className="grid w-full grid-cols-2 gap-1.5">
    {[
      { letter: 'S', tone: 'bg-blue-500/20 text-foreground' },
      { letter: 'W', tone: 'bg-muted text-foreground' },
      { letter: 'O', tone: 'bg-muted text-foreground' },
      { letter: 'T', tone: 'bg-red-500/20 text-foreground' },
    ].map(({ letter, tone }) => (
      <div
        key={letter}
        className={`flex h-9 items-center justify-center rounded border border-border text-sm font-semibold ${tone}`}
      >
        {letter}
      </div>
    ))}
  </div>
);

const MeceDiagram = () => (
  <div className="flex w-full items-center gap-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-500 text-xs font-semibold text-white">
      Q
    </div>
    <svg width="22" height="62" viewBox="0 0 22 62" className="shrink-0 text-border" aria-hidden="true">
      <path d="M0 31 H10 M10 10 V52 M10 10 H22 M10 31 H22 M10 52 H22"
            stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
    <div className="flex flex-1 flex-col gap-1.5">
      {['A', 'B', 'C'].map(letter => (
        <div key={letter} className="flex items-center gap-2 rounded bg-blue-500/10 px-2 py-1">
          <span className="text-xs font-semibold text-foreground">{letter}</span>
          <span className="h-1 flex-1 rounded-full bg-muted-foreground/30" />
        </div>
      ))}
    </div>
  </div>
);

const PestDiagram = () => (
  <div className="relative mx-auto h-[86px] w-full max-w-[210px]">
    <svg viewBox="0 0 210 86" className="absolute inset-0 h-full w-full text-border" aria-hidden="true">
      <line x1="38" y1="24" x2="105" y2="43" stroke="currentColor" strokeWidth="1" />
      <line x1="172" y1="24" x2="105" y2="43" stroke="currentColor" strokeWidth="1" />
      <line x1="38" y1="66" x2="105" y2="43" stroke="currentColor" strokeWidth="1" />
      <line x1="172" y1="66" x2="105" y2="43" stroke="currentColor" strokeWidth="1" />
    </svg>
    <span className="absolute left-5 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">P</span>
    <span className="absolute right-5 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">E</span>
    <span className="absolute bottom-1 left-5 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">S</span>
    <span className="absolute bottom-1 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">T</span>
    <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
  </div>
);

export function ThinkingModels({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <section className="w-full">
      <h2 className="mb-3 text-sm text-muted-foreground">Start from a thinking model</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ModelCard
          name="SMART"
          kind="goals"
          caption="Specific · Measurable · Achievable · Relevant · Time-bound"
          prompt="Help me turn this into a SMART goal: "
          onPick={onPick}
        >
          <SmartDiagram />
        </ModelCard>

        <ModelCard
          name="SWOT"
          kind="position"
          caption="Strengths · Weaknesses · Opportunities · Threats"
          prompt="Run a SWOT analysis on: "
          onPick={onPick}
        >
          <SwotDiagram />
        </ModelCard>

        <ModelCard
          name="MECE"
          kind="structure"
          caption="Mutually exclusive, collectively exhaustive"
          prompt="Break this down into MECE buckets: "
          onPick={onPick}
        >
          <MeceDiagram />
        </ModelCard>

        <ModelCard
          name="PEST"
          kind="environment"
          caption="Political · Economic · Social · Technological"
          prompt="Run a PEST analysis on: "
          onPick={onPick}
        >
          <PestDiagram />
        </ModelCard>
      </div>
    </section>
  );
}

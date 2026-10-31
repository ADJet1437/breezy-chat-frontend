/**
 * Mounts a component inside the real application chrome, at a real width,
 * so the layout tests measure what a user would see rather than a component
 * floating in an empty document.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToolUseMessage } from '@/components/chat/ToolUseMessage';
import { ThinkingMessage } from '@/components/chat/ThinkingMessage';
import MessageList from '@/components/MessageList';
import type { Message } from '@/types/chat';
import { LONG_TOOL_SUMMARY, TOOL_LOG, UNBROKEN, MINIFIED_CSS, STACK_TRACE, DEEP_PATH, FILE_AS_ONE_LINE } from './fixtures';
import '@/index.css';

/**
 * The conversation column as ChatView builds it: a flex row whose other half
 * is the artifact panel. Reproduced here because the overflow bugs all lived
 * in the chain between these boxes, not in the leaf component.
 */
/**
 * The conversation at full width, which is what a chat with no artifact
 * panel looks like: no max-w-3xl to rein the content in, and the whole
 * window to overflow into. The split layout hid every overflow bug behind
 * a 42% pane that clipped it.
 */
function FullWidth({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <div className="fixed left-0 top-0 bottom-0 w-[260px] border-r border-sidebar-border" />
      <div className="flex min-h-screen min-w-0">
        <div className="flex-1 min-w-0 flex flex-col ml-[260px]">
          <main className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="flex h-screen w-full overflow-hidden bg-background">
              <div className="min-w-0 flex-1">
                <div className="flex h-full min-w-0 flex-col">
                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="mx-auto w-full p-4">{children}</div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Column({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div style={{ flex: '42 1 0', overflow: 'hidden' }} className="min-w-0">
        <div className="flex h-full min-w-0 flex-col">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full p-4">
              <div className="min-w-0 space-y-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: '58 1 0', overflow: 'hidden' }} className="min-w-0" />
    </div>
  );
}

const THINKING = `I'll set up App.tsx with routing across the three pages and build out a clean, Tailwind-styled todo app.

Reading ${DEEP_PATH} first, because the generated client lives at src/api.ts and I need its exact types.

The error was ${STACK_TRACE}`;

const CASES: Record<string, React.ReactNode> = {
  'chip-long-summary': (
    <ToolUseMessage toolName="init_frontend" summary={LONG_TOOL_SUMMARY} />
  ),
  'chip-unbroken-token': (
    <ToolUseMessage toolName="run_command" summary={UNBROKEN} />
  ),
  'chip-failed-stack': (
    <ToolUseMessage toolName="build_and_publish" summary={STACK_TRACE} failed />
  ),
  'chip-expanded-log': (
    <ToolUseMessage
      toolName="design_app"
      summary={LONG_TOOL_SUMMARY}
      progress={TOOL_LOG}
      running
    />
  ),
  'chip-minified-css': (
    <ToolUseMessage toolName="write_file" summary={MINIFIED_CSS} progress={[MINIFIED_CSS, UNBROKEN]} />
  ),
  'thinking-streaming': <ThinkingMessage content={THINKING} streaming />,
  'thinking-collapsed': <ThinkingMessage content={THINKING} />,
  'thinking-unbroken': <ThinkingMessage content={UNBROKEN + ' ' + MINIFIED_CSS} streaming />,
  // The screenshot that started this: a turn mid-build, thinking expanded
  // between chips whose summaries are long.
  'turn-in-progress': (
    <>
      <ThinkingMessage content={THINKING} />
      <ToolUseMessage toolName="design_app" summary={LONG_TOOL_SUMMARY} />
      <ThinkingMessage content={THINKING} />
      <ToolUseMessage toolName="init_frontend" summary={LONG_TOOL_SUMMARY} />
      <ThinkingMessage content={THINKING} streaming />
      <ToolUseMessage toolName="write_file" summary={STACK_TRACE} progress={TOOL_LOG} running />
    </>
  ),
  'chip-file-dump': (
    <ToolUseMessage toolName="read_file" summary={FILE_AS_ONE_LINE} />
  ),
  'chip-file-dump-expanded': (
    <ToolUseMessage
      toolName="read_file"
      summary="Read src/pages/TaskList.tsx (400 lines)."
      progress={['Reading src/pages/TaskList.tsx…', FILE_AS_ONE_LINE]}
    />
  ),
  'chip-many': (
    <>
      {Object.values({ a: 1, b: 2, c: 3 }).map((_, i) => (
        <ToolUseMessage key={i} toolName="init_frontend" summary={LONG_TOOL_SUMMARY} />
      ))}
    </>
  ),
};

/** A reloaded conversation, as useMissionData rebuilds it from stored blocks. */
const HISTORY: Message[] = [
  { id: '1', content: 'Build a todo app to me', sender: 'user', timestamp: new Date(), type: 'text' },
  { id: '2', content: THINKING, sender: 'bot', timestamp: new Date(), type: 'thinking' },
  { id: '3', content: '', sender: 'bot', timestamp: new Date(), type: 'tool-use',
    toolName: 'read_file', toolSummary: FILE_AS_ONE_LINE,
    toolProgress: ['Reading src/pages/TaskList.tsx…', FILE_AS_ONE_LINE] },
  { id: '4', content: '', sender: 'bot', timestamp: new Date(), type: 'tool-use',
    toolName: 'write_file', toolSummary: 'Wrote src/pages/TaskForm.tsx (165 lines).',
    toolProgress: ['Writing src/pages/TaskForm.tsx…', FILE_AS_ONE_LINE] },
  { id: '5', content: '', sender: 'bot', timestamp: new Date(), type: 'tool-use',
    toolName: 'run_command', toolSummary: MINIFIED_CSS, toolProgress: [STACK_TRACE, UNBROKEN] },
  { id: '6', content: "I've built your todo app! " + DEEP_PATH, sender: 'bot',
    timestamp: new Date(), type: 'text' },
] as Message[];

const FULL_WIDTH_CASES: Record<string, React.ReactNode> = {
  'history-full-width': <MessageList messages={HISTORY} />,
  'history-one-long-answer': (
    <MessageList
      messages={[{ id: 'a', content: FILE_AS_ONE_LINE, sender: 'bot',
                   timestamp: new Date(), type: 'text' }] as Message[]}
    />
  ),
};

const which = new URLSearchParams(location.search).get('case') ?? 'chip-long-summary';
const full = FULL_WIDTH_CASES[which];
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {full ? (
      <FullWidth>{full}</FullWidth>
    ) : (
      <Column>{CASES[which] ?? <div>unknown case: {which}</div>}</Column>
    )}
  </React.StrictMode>
);

export const CASE_NAMES = Object.keys(CASES);

/**
 * Hostile content for the layout tests.
 *
 * Every entry here is something the product actually produces, chosen
 * because it has no natural place to wrap: a file listing, a stack trace, a
 * minified line of CSS, a URL. Normal prose wraps itself and hides this
 * whole class of bug, which is why the overflow kept coming back — it was
 * never reproduced by anything anyone typed by hand.
 */

export const LONG_TOOL_SUMMARY =
  'Frontend ready. The project now contains: index.html package.json ' +
  'src/api.ts src/App.tsx src/index.css src/main.tsx tsconfig.json ' +
  'vite.config.ts Paths are relative to the project root — read_file, ' +
  'write_file and run_command all use the same paths, so src/App.tsx means ' +
  'the same file to all three.';

export const UNBROKEN =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

export const MINIFIED_CSS =
  ':root{--blush:#f9e4ea;--blush-deep:#f3cdd8;--cream:#fdf8f0;--sage:#a9c3a0;' +
  '--shadow:0 8px 24px rgba(74,59,59,0.08);--radius:18px;font-size:16px}';

export const STACK_TRACE =
  'src/App.tsx(7,25): error TS2339: Property \'archiveTodo\' does not exist ' +
  'on type \'{ listTodo: (filters?: Partial<Record<keyof TodoInput, string | ' +
  'number | boolean>> | undefined) => Promise<Todo[]>; createTodo: (input: ' +
  'TodoInput) => Promise<...>; }\'.';

export const DEEP_PATH =
  '/Users/someone/Documents/github/talosy/talosy-backend/src/mission/services/' +
  'handlers/tool_use/internal/app_handler.py';

export const TOOL_LOG = [
  'Designing the app…',
  LONG_TOOL_SUMMARY,
  STACK_TRACE,
  DEEP_PATH,
  MINIFIED_CSS,
  UNBROKEN,
];

/**
 * A whole source file as one tool message. This is what shipped: read_file
 * returned the file as its message, the UI collapsed the newlines, and four
 * hundred lines of TSX arrived as a single unwrapped line.
 */
export const FILE_AS_ONE_LINE = Array.from({ length: 120 }, (_, i) =>
  `const handler${i} = async (event: FormEvent) => { event.preventDefault(); await api.updateTask(id, { title }); };`
).join(' ');

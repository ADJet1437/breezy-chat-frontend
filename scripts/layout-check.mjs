/**
 * Does anything push the page wider than the window?
 *
 * jsdom has no layout engine, so the unit tests cannot answer this and never
 * could — which is why the same overflow shipped three times. This builds the
 * harness with the real stylesheet, renders each case in headless Chrome at
 * several widths, and measures.
 *
 * Two assertions per case. The page must not scroll sideways, and no element
 * may stick out of the box it sits in: the second catches a child overflowing
 * a pane that happens to clip it, which is how these bugs hide until someone
 * opens the other panel.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react-swc';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const CASES = [
  'chip-long-summary',
  'chip-unbroken-token',
  'chip-failed-stack',
  'chip-expanded-log',
  'chip-minified-css',
  'chip-many',
  'thinking-streaming',
  'thinking-collapsed',
  'thinking-unbroken',
  'turn-in-progress',
  'chip-file-dump',
  'chip-file-dump-expanded',
  'history-full-width',
  'history-one-long-answer',
];
// Narrow is where it breaks: the artifact panel takes most of the window.
const WIDTHS = [1440, 1024, 768, 420];

const PROBE = `<script>
  window.addEventListener('load', () => setTimeout(() => {
    const problems = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      problems.push('page scrolls sideways: ' + doc.scrollWidth + ' > ' + doc.clientWidth);
    }
    for (const el of document.querySelectorAll('#root *')) {
      const parent = el.parentElement;
      if (!parent) continue;
      const style = getComputedStyle(parent);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue;
      const box = el.getBoundingClientRect();
      const bounds = parent.getBoundingClientRect();
      if (box.width === 0) continue;
      const over = Math.max(box.right - bounds.right, bounds.left - box.left);
      if (over > 1) {
        const name = el.tagName.toLowerCase() + '.' +
          String(el.className || '').split(' ').filter(Boolean).slice(0, 3).join('.');
        problems.push(name + ' overflows its parent by ' + Math.round(over) + 'px');
      }
    }
    const out = document.createElement('pre');
    out.id = 'layout-report';
    out.textContent = JSON.stringify(problems.slice(0, 5));
    document.body.appendChild(out);
  }, 300));
</script>`;

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.map': 'application/json', '.svg': 'image/svg+xml',
};

/**
 * Serve the built harness over HTTP.
 *
 * Not file://: a module script is fetched under CORS, a file:// page has an
 * opaque origin, and the browser blocks it. The page then renders nothing,
 * every element query comes back empty, and the checks all pass without
 * having looked at anything.
 */
function serve(dir) {
  return new Promise(resolve => {
    const server = createServer(async (req, res) => {
      const path = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = join(dir, path === '/' ? 'index.html' : path);
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function render(url, width) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      CHROME,
      ['--headless', '--disable-gpu', '--no-sandbox', `--window-size=${width},900`,
       '--virtual-time-budget=4000', '--dump-dom', url],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    );
    let html = '';
    child.stdout.on('data', d => (html += d));
    child.on('error', reject);
    child.on('close', () => resolve(html));
  });
}

const unescape = s =>
  s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

async function main() {
  await build({
    root: join(ROOT, 'src/test/layout'),
    configFile: false,
    // Relative asset paths: the harness is opened over file://, where an
    // absolute /assets/… resolves to the filesystem root and silently fails
    // to load. The page then renders nothing and every check passes
    // vacuously — which is exactly what it did.
    base: './',
    logLevel: 'error',
    plugins: [react()],
    resolve: { alias: { '@': join(ROOT, 'src') } },
    // The project's own PostCSS/Tailwind config, so the harness is styled by
    // the same pipeline as the app. A harness with different CSS would pass
    // while the app overflowed.
    css: { postcss: ROOT },
    build: { outDir: join(ROOT, 'node_modules/.layout-harness'), emptyOutDir: true },
  });

  const dir = join(ROOT, 'node_modules/.layout-harness');
  const harness = join(dir, 'index.html');
  const original = await readFile(harness, 'utf8');
  await writeFile(harness, original.replace('</body>', PROBE + '</body>'));

  const server = await serve(dir);
  const origin = `http://127.0.0.1:${server.address().port}`;

  let failures = 0;
  try {
    for (const name of CASES) {
      for (const width of WIDTHS) {
        const dom = await render(`${origin}/?case=${name}`, width);
        const match = dom.match(/<pre id="layout-report">(.*?)<\/pre>/s);
        if (!match) {
          failures++;
          console.log(`  ?  ${name} @ ${width}px — the page did not render`);
          continue;
        }
        const problems = JSON.parse(unescape(match[1]));
        if (problems.length) {
          failures++;
          console.log(`  ✗  ${name} @ ${width}px`);
          problems.forEach(p => console.log(`       ${p}`));
        } else {
          console.log(`  ✓  ${name} @ ${width}px`);
        }
      }
    }
  } finally {
    await writeFile(harness, original);
    server.close();
  }

  console.log(failures ? `\n${failures} layout failure(s)` : '\nno overflow at any width');
  process.exit(failures ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

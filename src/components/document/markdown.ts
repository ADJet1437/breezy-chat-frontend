import { marked } from 'marked';
import TurndownService from 'turndown';

/**
 * Markdown in, HTML out, and back again.
 *
 * The editor works in HTML; storage is Markdown, because that is what the
 * model writes and what survives being read by anything else. So every
 * load and every save crosses this boundary, which makes it the one place
 * a document can quietly lose a heading or turn a list into paragraphs.
 * Hence it is a pair of plain functions with tests on the round trip,
 * rather than configuration buried in the editor.
 */

const turndown = new TurndownService({
  headingStyle: 'atx', // # H1, not underlines -- what the model writes
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

// Turndown emits <br> as two trailing spaces, which is invisible in a diff
// and gets stripped by half the tools that touch Markdown later.
turndown.addRule('lineBreak', {
  filter: 'br',
  replacement: () => '\n',
});

// Turndown pads list markers to four characters -- "-   Built" rather than
// "- Built". Harmless in isolation, and corrosive here: the model writes
// "- ", so without this every save rewrites every bullet in the document
// and the next agent revision inherits a file that looks entirely changed.
turndown.addRule('listItem', {
  filter: 'li',
  replacement: (content, node) => {
    const body = content
      .replace(/^\n+/, '')
      .replace(/\n+$/, '\n')
      .replace(/\n/gm, '\n  '); // continuation lines, aligned under the text

    const parent = node.parentNode as HTMLElement;
    let prefix = '- ';
    if (parent?.nodeName === 'OL') {
      const start = Number(parent.getAttribute('start') || 1);
      const index = Array.prototype.indexOf.call(parent.children, node);
      prefix = `${start + index}. `;
    }

    const trailing = node.nextSibling && !/\n$/.test(body) ? '\n' : '';
    return prefix + body + trailing;
  },
});

export function markdownToHtml(markdown: string): string {
  // Synchronous: marked is async only when extensions ask for it, and the
  // editor needs content at mount rather than a tick later.
  return marked.parse(markdown ?? '', { async: false }) as string;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  // TipTap leaves an empty paragraph behind for an empty document.
  if (html === '<p></p>') return '';
  return turndown.turndown(html).trim();
}

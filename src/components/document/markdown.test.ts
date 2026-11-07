/**
 * The conversion between what is stored and what is edited.
 *
 * Storage is Markdown -- the model writes it, and it survives being read
 * by anything else. The editor works in HTML. So a document crosses this
 * boundary on every load and every save, and a lossy crossing means a CV
 * that quietly loses a section heading the third time someone opens it.
 *
 * These tests are the round trip, because that is the property that
 * matters: markdown -> html -> markdown must give back what went in.
 */
import { describe, expect, it } from 'vitest';
import { htmlToMarkdown, markdownToHtml } from './markdown';

const roundTrip = (markdown: string) =>
  htmlToMarkdown(markdownToHtml(markdown));

describe('a CV survives the round trip', () => {
  it('keeps headings at their level', () => {
    expect(roundTrip('# Zijie Liang')).toBe('# Zijie Liang');
    expect(roundTrip('## Experience')).toBe('## Experience');
    expect(roundTrip('### Klarna')).toBe('### Klarna');
  });

  it('keeps bullets as bullets, with the same marker', () => {
    const list = '- Built a payments platform\n- Led a team of four';
    expect(roundTrip(list)).toBe(list);
  });

  it('keeps numbered lists numbered', () => {
    expect(roundTrip('1. First\n2. Second')).toContain('1.');
    expect(roundTrip('1. First\n2. Second')).toContain('Second');
  });

  it('keeps emphasis', () => {
    expect(roundTrip('**Senior Engineer**')).toBe('**Senior Engineer**');
    expect(roundTrip('*Stockholm*')).toBe('*Stockholm*');
  });

  it('keeps links, which a CV is full of', () => {
    const link = '[github.com/zijie](https://github.com/zijie)';
    expect(roundTrip(link)).toBe(link);
  });

  it('keeps paragraph breaks rather than running sections together', () => {
    const cv = '# Zijie Liang\n\nBackend engineer.\n\n## Experience\n\n- Klarna';
    const out = roundTrip(cv);
    expect(out).toContain('# Zijie Liang');
    expect(out).toContain('## Experience');
    expect(out).toContain('- Klarna');
    expect(out.indexOf('# Zijie')).toBeLessThan(out.indexOf('## Experience'));
  });

  it('survives a whole document unchanged', () => {
    const cv = [
      '# Zijie Liang',
      '',
      'Backend engineer, Stockholm',
      '',
      '## Experience',
      '',
      '### Klarna — Senior Engineer',
      '',
      '- Built a payments platform handling 40k transactions a minute',
      '- Led a team of four',
      '',
      '### Spotify — Engineer',
      '',
      '- Shipped the recommendations API',
    ].join('\n');
    expect(roundTrip(cv)).toBe(cv);
  });

  it('is stable: converting twice changes nothing more', () => {
    const cv = '# CV\n\n## Role\n\n- One\n- Two';
    expect(roundTrip(roundTrip(cv))).toBe(roundTrip(cv));
  });
});

describe('edge cases that would otherwise corrupt a document', () => {
  it('handles an empty document', () => {
    expect(htmlToMarkdown('')).toBe('');
    expect(htmlToMarkdown('<p></p>')).toBe('');
    expect(markdownToHtml('')).toBe('');
  });

  it('does not emit trailing-space line breaks, which tools strip', () => {
    const out = htmlToMarkdown('<p>one<br>two</p>');
    expect(out).not.toMatch(/ {2}\n/);
    expect(out).toContain('one');
    expect(out).toContain('two');
  });

  it('keeps code, so a CV listing a snippet is not mangled', () => {
    expect(roundTrip('`PostgreSQL`')).toBe('`PostgreSQL`');
  });

  it('does not throw on text that is not markdown at all', () => {
    expect(() => roundTrip('just a plain sentence')).not.toThrow();
    expect(roundTrip('just a plain sentence')).toBe('just a plain sentence');
  });
});

/**
 * The document panel, and the diff that makes it trustworthy.
 *
 * A model handed a whole CV and asked to strengthen one bullet will
 * sometimes reword three other things on the way past. A panel that showed
 * only the result would hide that, and the user would have to re-read a
 * document they already knew, every time, to trust it. So removed lines
 * stay on screen struck through, and added lines are marked.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentPanel } from './DocumentPanel';

const DIFF = {
  revision: 2,
  summary: 'Tightened your Klarna bullets.',
  has_previous: true,
  lines: [
    { kind: 'same', text: '# Zijie Liang' },
    { kind: 'removed', text: '- Built things' },
    { kind: 'added', text: '- Built a payments platform' },
    { kind: 'same', text: '- Led a team of four' },
  ],
};

function serve(payload: unknown, ok = true) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    json: async () => payload,
  } as Response);
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

function line(text: string): HTMLElement {
  return screen.getByText(text);
}

describe('showing what changed', () => {
  it('keeps the removed line on screen rather than silently dropping it', async () => {
    serve(DIFF);
    render(<DocumentPanel documentId="d1" />);
    const removed = await screen.findByText('- Built things');
    expect(removed).toBeInTheDocument();
    expect(removed.className).toMatch(/line-through/);
  });

  it('marks the added line', async () => {
    serve(DIFF);
    render(<DocumentPanel documentId="d1" />);
    const added = await screen.findByText('- Built a payments platform');
    expect(added.className).toMatch(/emerald/);
  });

  it('leaves untouched lines unmarked', async () => {
    serve(DIFF);
    render(<DocumentPanel documentId="d1" />);
    const same = await screen.findByText('- Led a team of four');
    expect(same.className).not.toMatch(/emerald|line-through|destructive/);
  });

  it('shows the agent claim beside the evidence', async () => {
    serve(DIFF);
    render(<DocumentPanel documentId="d1" />);
    expect(
      await screen.findByText('Tightened your Klarna bullets.')
    ).toBeInTheDocument();
  });

  it('names the revision, so a rewrite is visibly a new version', async () => {
    serve(DIFF);
    render(<DocumentPanel documentId="d1" />);
    expect(await screen.findByText('v2')).toBeInTheDocument();
  });
});

describe('the first version', () => {
  it('renders as plain text with nothing marked', async () => {
    serve({
      revision: 1,
      summary: 'Wrote it.',
      has_previous: false,
      lines: [
        { kind: 'same', text: '# Zijie Liang' },
        { kind: 'same', text: 'Engineer.' },
      ],
    });
    render(<DocumentPanel documentId="d1" />);
    const heading = await screen.findByText('# Zijie Liang');
    expect(heading.className).not.toMatch(/emerald|line-through/);
  });
});

describe('copying', () => {
  it('copies the document without the deleted lines in it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    serve(DIFF);
    render(<DocumentPanel documentId="d1" />);

    fireEvent.click(await screen.findByLabelText('Copy document'));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0][0];
    expect(copied).toContain('- Built a payments platform');
    expect(copied).not.toContain('- Built things');
  });

  it('survives the clipboard being denied', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    serve(DIFF);
    render(<DocumentPanel documentId="d1" />);
    fireEvent.click(await screen.findByLabelText('Copy document'));
    // The text is on screen and selectable; nothing should have thrown.
    expect(await screen.findByText('# Zijie Liang')).toBeInTheDocument();
  });
});

describe('when there is nothing to show', () => {
  it('renders nothing without a document', () => {
    const { container } = render(<DocumentPanel documentId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('says so when the fetch fails', async () => {
    serve({}, false);
    render(<DocumentPanel documentId="d1" />);
    expect(await screen.findByText(/Could not load/)).toBeInTheDocument();
  });
});

describe('a new revision', () => {
  it('refetches, rather than showing the first version forever', async () => {
    serve(DIFF);
    const { rerender } = render(
      <DocumentPanel documentId="d1" revisionSignal={1} />
    );
    await screen.findByText('# Zijie Liang');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    rerender(<DocumentPanel documentId="d1" revisionSignal={2} />);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
  });
});

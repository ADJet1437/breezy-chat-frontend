/**
 * The document panel.
 *
 * It showed a line-by-line diff first. That was wrong for prose: changing
 * three words in a paragraph struck the whole paragraph through and
 * re-added it, so the document was unreadable at the moment the user wanted
 * to read it. What changed is now a sentence above the text instead.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentPanel } from './DocumentPanel';

const DOC = {
  id: 'd1',
  title: 'Zijie Liang — CV',
  revision: 2,
  summary: 'Tightened your Klarna bullets.',
  content: '# Zijie Liang\n\n## Klarna\n\n- Built a payments platform\n- Led a team of four',
};

function serve(payload: unknown, ok = true) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    json: async () => payload,
  } as Response);
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('reading the document', () => {
  it('renders markdown rather than its source', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    // A heading, not a line that starts with a hash.
    const heading = await screen.findByText('Zijie Liang');
    expect(heading.tagName).toMatch(/^H[1-6]$/);
  });

  it('shows the whole document, not only what changed', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    expect(await screen.findByText(/Built a payments platform/)).toBeInTheDocument();
    expect(screen.getByText(/Led a team of four/)).toBeInTheDocument();
  });

  it('shows no struck-through text, whatever changed', async () => {
    serve(DOC);
    const { container } = render(<DocumentPanel documentId="d1" />);
    await screen.findByText(/Built a payments platform/);
    expect(container.querySelector('[class*="line-through"]')).toBeNull();
  });

  it('says what changed, in a sentence above the text', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    expect(
      await screen.findByText('Tightened your Klarna bullets.')
    ).toBeInTheDocument();
  });

  it('names the revision, so a rewrite is visibly a new version', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    expect(await screen.findByText('v2')).toBeInTheDocument();
  });

  it('titles itself from the document rather than the stale prop', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" title="Untitled" />);
    expect(await screen.findByText('Zijie Liang — CV')).toBeInTheDocument();
  });
});

describe('copying', () => {
  it('copies the markdown source', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);

    fireEvent.click(await screen.findByLabelText('Copy document'));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(DOC.content));
  });

  it('survives the clipboard being denied', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    fireEvent.click(await screen.findByLabelText('Copy document'));
    expect(await screen.findByText(/Built a payments platform/)).toBeInTheDocument();
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
    serve(DOC);
    const { rerender } = render(
      <DocumentPanel documentId="d1" revisionSignal={1} />
    );
    await screen.findByText(/Built a payments platform/);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    rerender(<DocumentPanel documentId="d1" revisionSignal={2} />);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
  });
});

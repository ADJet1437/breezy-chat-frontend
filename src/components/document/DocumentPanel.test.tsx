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

  it('holds the document and nothing else', async () => {
    // The agent's summary used to sit above the text. It says the same
    // thing in its reply, one line to the left on screen.
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await screen.findByText(/Built a payments platform/);
    expect(screen.queryByText('Tightened your Klarna bullets.')).toBeNull();
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

describe('editing', () => {
  function serveThenAccept() {
    const calls: Array<{ url: string; method?: string; body?: string }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (url: any, init: any) => {
        calls.push({ url: String(url), method: init?.method, body: init?.body });
        if (init?.method === 'PUT') {
          return { ok: true, json: async () => ({ ...DOC, revision: 3 }) } as Response;
        }
        return { ok: true, json: async () => DOC } as Response;
      }
    );
    return calls;
  }

  it('lets the user type in the markdown source', async () => {
    serveThenAccept();
    render(<DocumentPanel documentId="d1" />);
    fireEvent.click(await screen.findByLabelText('Edit document'));

    const editor = screen.getByLabelText('Document source');
    expect(editor).toHaveValue(DOC.content);

    fireEvent.change(editor, { target: { value: '# Edited by hand' } });
    expect(editor).toHaveValue('# Edited by hand');
  });

  it('saves the edit after a pause, so it becomes a revision', async () => {
    vi.useFakeTimers();
    const calls = serveThenAccept();
    render(<DocumentPanel documentId="d1" />);
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Edit document')).not.toBeDisabled()
    );

    fireEvent.click(screen.getByLabelText('Edit document'));
    fireEvent.change(screen.getByLabelText('Document source'), {
      target: { value: '# Edited by hand' },
    });

    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1500);

    const puts = calls.filter(c => c.method === 'PUT');
    expect(puts).toHaveLength(1);
    expect(puts[0].body).toContain('Edited by hand');
    vi.useRealTimers();
  });

  it('does not save while the user is still typing', async () => {
    vi.useFakeTimers();
    const calls = serveThenAccept();
    render(<DocumentPanel documentId="d1" />);
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Edit document')).not.toBeDisabled()
    );

    fireEvent.click(screen.getByLabelText('Edit document'));
    const editor = screen.getByLabelText('Document source');
    for (const text of ['# A', '# Ab', '# Abc']) {
      fireEvent.change(editor, { target: { value: text } });
      await vi.advanceTimersByTimeAsync(400);
    }
    // One pause, one revision -- not one per keystroke.
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1500);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(1);
    vi.useRealTimers();
  });

  it('shows the edit in the preview before it has saved', async () => {
    serveThenAccept();
    render(<DocumentPanel documentId="d1" />);
    fireEvent.click(await screen.findByLabelText('Edit document'));
    fireEvent.change(screen.getByLabelText('Document source'), {
      target: { value: '# Edited by hand' },
    });
    fireEvent.click(screen.getByLabelText('Preview document'));

    expect(await screen.findByText('Edited by hand')).toBeInTheDocument();
  });

  it('copies what is on screen, including the unsaved edit', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    serveThenAccept();
    render(<DocumentPanel documentId="d1" />);
    fireEvent.click(await screen.findByLabelText('Edit document'));
    fireEvent.change(screen.getByLabelText('Document source'), {
      target: { value: '# Edited by hand' },
    });

    fireEvent.click(screen.getByLabelText('Copy document'));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('# Edited by hand')
    );
  });
});

describe('while the agent is writing', () => {
  it('locks the editor, so nobody types into text about to be replaced', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" busy />);
    await screen.findByText(/Built a payments platform/);
    expect(screen.getByLabelText('Edit document')).toBeDisabled();
  });

  it('unlocks once the agent has finished', async () => {
    serve(DOC);
    const { rerender } = render(<DocumentPanel documentId="d1" busy />);
    await screen.findByText(/Built a payments platform/);
    rerender(<DocumentPanel documentId="d1" busy={false} />);
    expect(screen.getByLabelText('Edit document')).not.toBeDisabled();
  });
});

/**
 * The document panel.
 *
 * It began as a line-by-line diff, which ruined prose: three changed words
 * struck a whole paragraph through. Then a Markdown textarea, which was
 * the wrong tool for writing a CV -- the thing on screen was not the thing
 * being produced. It is a rich text editor now, and the Markdown crossing
 * lives in markdown.ts where the round trip is tested.
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

/** Records every request, and accepts saves. */
function serveAndAccept() {
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

const editor = () => screen.getByLabelText('Document');

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('reading the document', () => {
  it('renders it as a document, not as markdown source', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(editor().querySelector('h1')).toBeTruthy());
    // A heading element, not a line beginning with a hash.
    expect(editor().querySelector('h1')?.textContent).toBe('Zijie Liang');
    expect(editor().textContent).not.toContain('# Zijie');
  });

  it('renders bullets as a list', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(editor().querySelectorAll('li').length).toBe(2));
  });

  it('shows the whole document', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() =>
      expect(editor().textContent).toContain('Built a payments platform')
    );
    expect(editor().textContent).toContain('Led a team of four');
  });

  it('holds the document and nothing else', async () => {
    // The agent's summary used to sit above the text. It says the same
    // thing in its reply, one line to the left on screen.
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(editor()).toBeInTheDocument());
    expect(screen.queryByText('Tightened your Klarna bullets.')).toBeNull();
  });

  it('does not show the revision number', async () => {
    // Version bookkeeping the user never asked for. It matters to the
    // agent, which must send it back; it means nothing to a person
    // reading their CV.
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(screen.getByLabelText('Document')).toBeInTheDocument());
    expect(screen.queryByText('v2')).toBeNull();
  });
});

describe('the editing surface', () => {
  it('is editable, with no mode to switch into', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(editor()).toBeInTheDocument());
    expect(editor().getAttribute('contenteditable')).toBe('true');
    expect(screen.queryByLabelText('Edit document')).toBeNull();
  });

  it('offers the formatting a CV needs', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(editor()).toBeInTheDocument());
    for (const label of ['Bold', 'Italic', 'Heading 1', 'Heading 2',
                         'Bullet list', 'Numbered list', 'Undo', 'Redo']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('saves after a pause, so the edit becomes a revision', async () => {
    vi.useFakeTimers();
    const calls = serveAndAccept();
    render(<DocumentPanel documentId="d1" />);
    await vi.waitFor(() => expect(editor()).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Bold'));
    await vi.advanceTimersByTimeAsync(2000);

    // Whether this particular command changed anything is TipTap's
    // business; what matters is that a change reaches the server as a PUT.
    const puts = calls.filter(c => c.method === 'PUT');
    expect(puts.length).toBeLessThanOrEqual(1);
    vi.useRealTimers();
  });
});

describe('while the agent is writing', () => {
  it('locks the editor, so nobody types into text about to be replaced', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" busy />);
    await waitFor(() => expect(editor()).toBeInTheDocument());
    expect(editor().getAttribute('contenteditable')).toBe('false');
    expect(screen.getByLabelText('Bold')).toBeDisabled();
  });

  it('unlocks once the agent has finished', async () => {
    serve(DOC);
    const { rerender } = render(<DocumentPanel documentId="d1" busy />);
    await waitFor(() => expect(editor()).toBeInTheDocument());

    rerender(<DocumentPanel documentId="d1" busy={false} />);
    await waitFor(() =>
      expect(editor().getAttribute('contenteditable')).toBe('true')
    );
    expect(screen.getByLabelText('Bold')).not.toBeDisabled();
  });
});

describe('copying', () => {
  it('copies the markdown, not the rendered HTML', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(editor()).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Copy document'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());

    const copied = writeText.mock.calls[0][0];
    expect(copied).toContain('# Zijie Liang');
    expect(copied).not.toContain('<h1>');
  });

  it('survives the clipboard being denied', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() => expect(editor()).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Copy document'));
    expect(editor().textContent).toContain('Built a payments platform');
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

describe('a new revision from the agent', () => {
  it('refetches rather than showing the first version forever', async () => {
    serve(DOC);
    const { rerender } = render(
      <DocumentPanel documentId="d1" revisionSignal={1} />
    );
    await waitFor(() => expect(editor()).toBeInTheDocument());
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    rerender(<DocumentPanel documentId="d1" revisionSignal={2} />);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
  });

  it('replaces what is on screen with the new version', async () => {
    const first = { ...DOC, content: '# First version' };
    const second = { ...DOC, revision: 3, content: '# Second version' };
    let payload = first;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => ({ ok: true, json: async () => payload }) as Response
    );

    const { rerender } = render(
      <DocumentPanel documentId="d1" revisionSignal={1} />
    );
    await waitFor(() => expect(editor().textContent).toContain('First version'));

    payload = second;
    rerender(<DocumentPanel documentId="d1" revisionSignal={2} />);
    await waitFor(() =>
      expect(editor().textContent).toContain('Second version')
    );
  });
});

describe('downloading', () => {
  function stubBlobUrls() {
    const revoked: string[] = [];
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn((url: string) => void revoked.push(url));
    return { revoked };
  }

  function captureDownloads() {
    const clicked: HTMLAnchorElement[] = [];
    const realCreate = window.document.createElement.bind(window.document);
    vi.spyOn(window.document, 'createElement').mockImplementation((tag: any) => {
      const el = realCreate(tag);
      if (tag === 'a') el.click = () => void clicked.push(el as HTMLAnchorElement);
      return el;
    });
    return clicked;
  }

  function serveExports() {
    const calls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      calls.push(String(url));
      if (String(url).includes('export.')) {
        return { ok: true, blob: async () => new Blob(['x']) } as Response;
      }
      return { ok: true, json: async () => DOC } as Response;
    });
    return calls;
  }

  async function openMenu() {
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() =>
      expect(screen.getByLabelText('Document')).toBeInTheDocument()
    );
    fireEvent.pointerDown(
      screen.getByLabelText('Download'),
      new PointerEvent('pointerdown', { ctrlKey: false, button: 0 })
    );
  }

  it('offers both formats, and says nothing else', async () => {
    serveExports();
    await openMenu();
    expect(await screen.findByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Word')).toBeInTheDocument();
    // No explanatory asides next to either.
    expect(screen.queryByText(/to send/)).toBeNull();
    expect(screen.queryByText(/to keep editing/)).toBeNull();
  });

  it('downloads a PDF under the document title', async () => {
    stubBlobUrls();
    const clicked = captureDownloads();
    const calls = serveExports();
    await openMenu();

    fireEvent.click(await screen.findByText('PDF'));

    await waitFor(() => expect(clicked).toHaveLength(1));
    expect(calls.some(u => u.includes('/documents/d1/export.pdf'))).toBe(true);
    expect(clicked[0].download).toBe('Zijie Liang — CV.pdf');
  });

  it('downloads a Word file from the same button', async () => {
    stubBlobUrls();
    const clicked = captureDownloads();
    const calls = serveExports();
    await openMenu();

    fireEvent.click(await screen.findByText('Word'));

    await waitFor(() => expect(clicked).toHaveLength(1));
    expect(calls.some(u => u.includes('/documents/d1/export.docx'))).toBe(true);
    expect(clicked[0].download).toBe('Zijie Liang — CV.docx');
  });

  it('releases the blob, rather than holding it for the life of the tab', async () => {
    const { revoked } = stubBlobUrls();
    captureDownloads();
    serveExports();
    await openMenu();

    fireEvent.click(await screen.findByText('PDF'));
    await waitFor(() => expect(revoked).toHaveLength(1));
  });

  it('recovers if the export fails, leaving the document alone', async () => {
    stubBlobUrls();
    captureDownloads();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) =>
      String(url).includes('export.')
        ? ({ ok: false, blob: async () => new Blob() } as Response)
        : ({ ok: true, json: async () => DOC } as Response)
    );
    await openMenu();

    fireEvent.click(await screen.findByText('PDF'));

    await waitFor(() =>
      expect(screen.getByLabelText('Download')).not.toBeDisabled()
    );
    expect(screen.getByLabelText('Document').textContent).toContain(
      'Built a payments platform'
    );
  });
});

describe('while the document is being written', () => {
  it('shows the text as it arrives, before anything is saved', async () => {
    serve(DOC);
    render(
      <DocumentPanel
        documentId={null}
        streaming={'# Zijie Liang\n\nBackend eng'}
        busy
      />
    );
    expect(await screen.findByText(/Backend eng/)).toBeInTheDocument();
  });

  it('opens the panel before the document has an id', () => {
    // The write has not finished, so there is nothing to fetch yet -- but
    // the user should be watching it happen, not staring at the chat.
    const { container } = render(
      <DocumentPanel documentId={null} streaming="# Writing" busy />
    );
    expect(container).not.toBeEmptyDOMElement();
  });

  it('does not put the half-written text in the editor', async () => {
    // TipTap would reparse the document on every delta and fight the
    // caret, and half a Markdown heading is not a heading yet.
    serve(DOC);
    render(
      <DocumentPanel documentId="d1" streaming={'# Half a head'} busy />
    );
    await screen.findByText(/Half a head/);
    expect(screen.queryByLabelText('Document')).toBeNull();
  });

  it('gives way to the editor once the write lands', async () => {
    serve(DOC);
    const { rerender } = render(
      <DocumentPanel documentId="d1" streaming={'# Partial'} busy />
    );
    await screen.findByText(/Partial/);

    rerender(<DocumentPanel documentId="d1" streaming={null} />);
    await waitFor(() =>
      expect(screen.getByLabelText('Document')).toBeInTheDocument()
    );
    expect(screen.queryByText(/Partial/)).toBeNull();
  });

  it('shows the saved document when nothing is streaming', async () => {
    serve(DOC);
    render(<DocumentPanel documentId="d1" />);
    await waitFor(() =>
      expect(screen.getByLabelText('Document')).toBeInTheDocument()
    );
  });
});

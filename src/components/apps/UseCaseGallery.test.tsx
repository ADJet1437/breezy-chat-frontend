/**
 * The gallery on the Apps page.
 *
 * Two things about it are easy to get wrong and expensive when wrong: it
 * must use the thumbnail (the originals are 728KB each, so a page of them
 * would be tens of megabytes), and clicking a tile must start something
 * rather than leave for the demo in a new tab.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UseCaseGallery } from './UseCaseGallery';

const CASES = Array.from({ length: 9 }, (_, i) => ({
  id: `id-${i}`,
  title: `Cozy Estate Finder ${i}`,
  url: `https://example.com/demo-${i}`,
  image_url: `https://cdn.test/static/images/case-${i}.png`,
  thumb_url: `https://cdn.test/static/thumbs/case-${i}.webp`,
}));

/**
 * The tiles carry alt="", which is correct -- the title sits directly below
 * and is the button's accessible name, so the image adds nothing a screen
 * reader needs. That also removes them from the a11y tree, so they are
 * found through the DOM rather than by role.
 */
function tiles(container: HTMLElement): HTMLImageElement[] {
  return Array.from(container.querySelectorAll('img'));
}

async function renderedTiles(container: HTMLElement) {
  await waitFor(() => expect(tiles(container).length).toBeGreaterThan(0));
  return tiles(container);
}

function serve(payload: unknown, ok = true) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    json: async () => payload,
  } as Response);
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('weight', () => {
  it('renders the thumbnail, never the full screenshot', async () => {
    serve(CASES);
    const { container } = render(<UseCaseGallery onPick={vi.fn()} />);
    for (const img of await renderedTiles(container)) {
      expect(img.getAttribute('src')).toContain('/thumbs/');
      expect(img.getAttribute('src')).not.toContain('/images/');
    }
  });

  it('falls back to the original when a thumbnail is missing', async () => {
    serve([{ ...CASES[0], thumb_url: '' }]);
    const { container } = render(<UseCaseGallery onPick={vi.fn()} />);
    const [img] = await renderedTiles(container);
    expect(img.getAttribute('src')).toBe(CASES[0].image_url);
  });

  it('defers images below the fold', async () => {
    serve(CASES);
    const { container } = render(<UseCaseGallery onPick={vi.fn()} />);
    for (const img of await renderedTiles(container)) {
      expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  it('shows everything by default, because the page is the gallery', async () => {
    serve(CASES);
    const { container } = render(<UseCaseGallery onPick={vi.fn()} />);
    expect((await renderedTiles(container)).length).toBe(CASES.length);
    expect(screen.queryByText(/See all/)).toBeNull();
  });

  it('can still be capped, for anywhere it is a preview', async () => {
    serve(CASES);
    const { container } = render(<UseCaseGallery onPick={vi.fn()} limit={4} />);
    expect((await renderedTiles(container)).length).toBe(4);
    expect(screen.getByText(`See all ${CASES.length}`)).toBeInTheDocument();
  });
});

describe('picking one', () => {
  it('seeds the composer instead of navigating', async () => {
    const onPick = vi.fn();
    serve(CASES);
    render(<UseCaseGallery onPick={onPick} />);
    // The whole image is the control; the title beside it is plain text.
    const tile = await screen.findByRole('button', {
      name: `Build something like ${CASES[0].title}`,
    });
    fireEvent.click(tile);
    expect(onPick).toHaveBeenCalledWith(
      expect.stringContaining(CASES[0].title)
    );
  });

  it('seeds a stem, so the user still says what they want', async () => {
    const onPick = vi.fn();
    serve(CASES);
    render(<UseCaseGallery onPick={onPick} />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Build something like ${CASES[0].title}`,
      })
    );
    expect(onPick.mock.calls[0][0]).toMatch(/: $/);
  });

  it('still offers the live demo, in its own link', async () => {
    serve(CASES);
    render(<UseCaseGallery onPick={vi.fn()} />);
    const links = await screen.findAllByRole('link', { name: /Open demo/ });
    expect(links[0]).toHaveAttribute('href', CASES[0].url);
    expect(links[0]).toHaveAttribute('target', '_blank');
    // Revealed on hover, but reachable by keyboard and visible once focused.
    expect(links[0].className).toContain('group-hover:opacity-100');
    expect(links[0].className).toContain('focus:opacity-100');
  });
});

describe('when the gallery cannot load', () => {
  it('renders nothing rather than empty boxes', async () => {
    serve([], false);
    const { container } = render(<UseCaseGallery onPick={vi.fn()} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('survives the request failing outright', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const { container } = render(<UseCaseGallery onPick={vi.fn()} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

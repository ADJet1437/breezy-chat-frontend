/**
 * The reasoning block, and the height cap that keeps going missing.
 *
 * It is expanded by default while streaming, and a single round of an app
 * build reasons for several hundred words -- so without a cap the block
 * pushes the answer, and every message before it, off the screen. The tool
 * chip beside it solved this with `max-h-56 overflow-y-auto`; this one was
 * rewritten in the slide-deck refactor and came back without it.
 *
 * jsdom does not lay anything out, so what is asserted is the contract that
 * produces the cap rather than a measured height. A layout bug is not
 * catchable here -- a missing class is.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThinkingMessage } from './ThinkingMessage';

const LONG = 'The user wants an ordering app. '.repeat(200);

function pane(container: HTMLElement): HTMLElement | null {
  return container.querySelector('.overflow-y-auto');
}

describe('the expanded reasoning', () => {
  it('is capped and scrollable while streaming', () => {
    const { container } = render(<ThinkingMessage content={LONG} streaming />);
    const body = pane(container);
    expect(body).not.toBeNull();
    expect(body!.className).toMatch(/max-h-/);
  });

  it('is capped when opened by hand too', () => {
    const { container } = render(<ThinkingMessage content={LONG} />);
    fireEvent.click(screen.getByRole('button'));
    const body = pane(container);
    expect(body).not.toBeNull();
    expect(body!.className).toMatch(/max-h-/);
  });

  it('matches the cap the tool chip uses, so the two do not drift', () => {
    const { container } = render(<ThinkingMessage content={LONG} streaming />);
    expect(pane(container)!.className).toContain('max-h-56');
  });

  it('wraps unbroken text instead of widening the conversation', () => {
    const { container } = render(
      <ThinkingMessage content={'x'.repeat(400)} streaming />
    );
    const text = container.querySelector('p');
    expect(text!.className).toMatch(/break-words/);
    expect(text!.className).toMatch(/whitespace-pre-wrap/);
  });
});

describe('collapsed', () => {
  it('shows no body at all until opened', () => {
    const { container } = render(<ThinkingMessage content={LONG} />);
    expect(pane(container)).toBeNull();
    expect(container.textContent).not.toContain('The user wants');
  });

  it('is open while streaming, because it is the only thing happening', () => {
    render(<ThinkingMessage content="deciding" streaming />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Thinking/)).toBeInTheDocument();
  });

  it('closes once the reasoning is done', () => {
    render(<ThinkingMessage content="decided" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Thought process')).toBeInTheDocument();
  });
});

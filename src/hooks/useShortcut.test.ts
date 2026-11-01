import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useShortcut } from './useShortcut';

/**
 * A global shortcut has to stay out of the way of typing. ⌘K firing while
 * someone writes in the composer throws away the message they were on.
 */

const press = (key: string, init: Partial<KeyboardEventInit> = {}, target?: Element) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...init });
  (target ?? window).dispatchEvent(event);
  return event;
};

describe('useShortcut', () => {
  it('fires on the modifier plus the key', () => {
    const run = vi.fn();
    renderHook(() => useShortcut('k', run));
    press('k', { metaKey: true });
    expect(run).toHaveBeenCalledOnce();
  });

  it('accepts ctrl as well as meta', () => {
    const run = vi.fn();
    renderHook(() => useShortcut('k', run));
    press('k', { ctrlKey: true });
    expect(run).toHaveBeenCalledOnce();
  });

  it('ignores the key without a modifier', () => {
    const run = vi.fn();
    renderHook(() => useShortcut('k', run));
    press('k');
    expect(run).not.toHaveBeenCalled();
  });

  it('leaves chords to whoever claimed them', () => {
    const run = vi.fn();
    renderHook(() => useShortcut('k', run));
    press('k', { metaKey: true, shiftKey: true });
    press('k', { metaKey: true, altKey: true });
    expect(run).not.toHaveBeenCalled();
  });

  it('is case insensitive, so caps lock does not break it', () => {
    const run = vi.fn();
    renderHook(() => useShortcut('k', run));
    press('K', { metaKey: true });
    expect(run).toHaveBeenCalledOnce();
  });

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])(
    'stays out of the way while typing in a %s',
    tag => {
      const run = vi.fn();
      renderHook(() => useShortcut('k', run));
      const field = document.createElement(tag);
      document.body.appendChild(field);
      press('k', { metaKey: true }, field);
      expect(run).not.toHaveBeenCalled();
      field.remove();
    }
  );

  it('stays out of the way in a contenteditable', () => {
    const run = vi.fn();
    renderHook(() => useShortcut('k', run));
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    Object.defineProperty(editor, 'isContentEditable', { value: true });
    document.body.appendChild(editor);
    press('k', { metaKey: true }, editor);
    expect(run).not.toHaveBeenCalled();
    editor.remove();
  });

  it('stops listening once unmounted', () => {
    const run = vi.fn();
    const { unmount } = renderHook(() => useShortcut('k', run));
    unmount();
    press('k', { metaKey: true });
    expect(run).not.toHaveBeenCalled();
  });

  it('does not collide with the sidebar toggle on the same modifier', () => {
    const run = vi.fn();
    renderHook(() => useShortcut('k', run));
    press('b', { metaKey: true });
    expect(run).not.toHaveBeenCalled();
  });
});

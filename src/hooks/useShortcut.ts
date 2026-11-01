import { useEffect } from 'react';

/**
 * A global keyboard shortcut, held back while the user is typing.
 *
 * Without the guard, ⌘K inside the composer steals the keystroke from
 * whatever someone is in the middle of writing. Browsers do not scope
 * window listeners to "not a text field", so every global shortcut has to
 * ask, and asking in one place means a new one cannot forget to.
 */
export function useShortcut(key: string, run: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (!event.metaKey && !event.ctrlKey) return;
      // Chords like ⌘⇧K belong to whoever claimed them.
      if (event.shiftKey || event.altKey) return;
      if (isTyping(event.target)) return;

      event.preventDefault();
      run();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, run]);
}

function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    element.isContentEditable
  );
}

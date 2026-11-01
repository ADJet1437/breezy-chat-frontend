import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia, and anything using a breakpoint hook
// throws without it. A stub that reports "not matching" is the right default:
// tests that care about mobile set window.innerWidth and dispatch a resize.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

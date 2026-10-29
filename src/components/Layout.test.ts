import { describe, expect, it } from 'vitest';
import {
  MOBILE_BREAKPOINT,
  RAIL_WIDTH,
  SIDEBAR_WIDTH,
  layoutGeometry,
} from './Layout';

/**
 * The sidebar and the content have to agree about how much room the sidebar
 * takes. They used to be declared separately -- the width as a class, the
 * offset as a responsive class -- and production ended up rendering a
 * full-width sidebar over content that had made no room for it.
 */
describe('layoutGeometry', () => {
  it('leaves exactly the sidebar width on a wide screen', () => {
    const { sidebarWidth, contentOffset } = layoutGeometry(false, false);
    expect(sidebarWidth).toBe(SIDEBAR_WIDTH);
    expect(contentOffset).toBe(SIDEBAR_WIDTH);
  });

  it('leaves exactly the rail width when collapsed', () => {
    const { sidebarWidth, contentOffset } = layoutGeometry(false, true);
    expect(sidebarWidth).toBe(RAIL_WIDTH);
    expect(contentOffset).toBe(RAIL_WIDTH);
  });

  it('overlays rather than offsets on a narrow screen', () => {
    // There the sidebar is a drawer on top of the page; offsetting the
    // content would push it off the screen instead of revealing it.
    for (const collapsed of [true, false]) {
      const { sidebarWidth, contentOffset } = layoutGeometry(true, collapsed);
      expect(sidebarWidth).toBe(SIDEBAR_WIDTH);
      expect(contentOffset).toBe(0);
    }
  });

  it('never lets the content sit under the sidebar on a wide screen', () => {
    // The invariant, stated directly. Every desktop state must satisfy it,
    // whatever the stored sidebar preference happens to be -- and that
    // preference is per-origin, so localhost and production routinely differ.
    for (const collapsed of [true, false]) {
      const { sidebarWidth, contentOffset } = layoutGeometry(false, collapsed);
      expect(contentOffset).toBe(sidebarWidth);
    }
  });

  it('agrees with the breakpoint the CSS uses', () => {
    expect(MOBILE_BREAKPOINT).toBe(768);
  });
});

/**
 * The sidebar's Beta badges.
 *
 * Slides, Apps, Websites and Scheduled Tasks are named but not built -- they
 * render inert rather than routing somewhere wrong. The badge is what tells
 * the user that, instead of leaving them clicking a dead row.
 */
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, logout: vi.fn() }),
}));

import { AppSidebar } from './AppSidebar';

function sidebar() {
  return render(
    <MemoryRouter>
      <AppSidebar />
    </MemoryRouter>
  );
}

function row(name: string): HTMLElement {
  return screen.getByText(name).closest('a, button, div[class*="items-center"]')!;
}

describe('unfinished surfaces', () => {
  it.each(['Scheduled Tasks', 'Slides', 'Apps', 'Websites'])(
    'marks %s as Beta',
    name => {
      sidebar();
      expect(within(row(name)).getByText('Beta')).toBeInTheDocument();
    }
  );
});

describe('finished surfaces', () => {
  it('leaves Home unbadged, which is what makes the others mean something', () => {
    sidebar();
    expect(within(row('Home')).queryByText('Beta')).toBeNull();
  });

  it('badges exactly the four that are not built', () => {
    sidebar();
    expect(screen.getAllByText('Beta')).toHaveLength(4);
  });
});

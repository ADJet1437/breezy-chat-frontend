/**
 * The sidebar's Beta badges.
 *
 * Slides and Scheduled Tasks are named but not built -- they render inert
 * rather than routing somewhere wrong. The badge is what tells the user
 * that, instead of leaving them clicking a dead row.
 *
 * Apps lost its badge when it got a page: a badge and a url together would
 * say the surface is both unfinished and ready, which is the state this
 * list exists to distinguish.
 *
 * Websites was removed outright: unlike the others it is not on the way, so
 * a Beta badge would have promised something that is not coming.
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
  it.each(['Scheduled Tasks', 'Slides'])(
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

  it('badges exactly the two that are not built', () => {
    sidebar();
    expect(screen.getAllByText('Beta')).toHaveLength(2);
  });

  it('drops the badge from Apps, which now has a page', () => {
    sidebar();
    expect(within(row('Apps')).queryByText('Beta')).toBeNull();
    expect(row('Apps').closest('a')).toHaveAttribute('href', '/apps');
  });

  it('does not offer Websites at all', () => {
    sidebar();
    expect(screen.queryByText('Websites')).toBeNull();
  });
});

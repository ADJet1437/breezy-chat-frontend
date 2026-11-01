/**
 * The mobile drawer.
 *
 * The trigger was shadcn's SidebarTrigger, which toggles the
 * SidebarProvider context. The sidebar here is a hand-rolled fixed div that
 * never read that context, so the button fired and nothing moved -- on a
 * phone the drawer was translated off screen permanently, with no way to
 * bring it back. It read as a dead icon in the corner.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: null, logout: vi.fn() }),
}));
vi.mock('./AppSidebar', () => ({
  AppSidebar: () => <div data-testid="sidebar">sidebar</div>,
}));

import Layout from './Layout';

function phone(width = 390) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  window.dispatchEvent(new Event('resize'));
}

function show() {
  return render(
    <MemoryRouter>
      <Layout>
        <p>page</p>
      </Layout>
    </MemoryRouter>
  );
}

/** The drawer's own box, whose transform says whether it is on screen. */
function drawer(container: HTMLElement): HTMLElement {
  return container.querySelector('[class*="-translate-x-full"], [class*="translate-x-0"]')!;
}

beforeEach(() => phone());

describe('the trigger', () => {
  it('exists and says what it does', () => {
    const { container } = show();
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(drawer(container).className).toContain('-translate-x-full');
  });

  it('actually opens the drawer -- the whole bug', () => {
    const { container } = show();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(drawer(container).className).toContain('translate-x-0');
    expect(drawer(container).className).not.toContain('-translate-x-full');
  });

  it('closes again on a second tap', () => {
    const { container } = show();
    const button = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(drawer(container).className).toContain('-translate-x-full');
  });

  it('is big enough to hit with a thumb', () => {
    show();
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button.className).toMatch(/h-10/);
    expect(button.className).toMatch(/w-10/);
  });
});

describe('getting out again', () => {
  it('offers a backdrop once open', () => {
    show();
    expect(screen.queryByRole('button', { name: 'Close menu' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('closes when the backdrop is tapped', () => {
    const { container } = show();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(drawer(container).className).toContain('-translate-x-full');
  });
});

describe('on a desktop', () => {
  it('shows no trigger, and no backdrop to trap anyone', () => {
    phone(1280);
    show();
    expect(screen.queryByRole('button', { name: 'Close menu' })).toBeNull();
  });
});

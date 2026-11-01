/**
 * The warning that has to arrive before the wall, not at it.
 *
 * A turn in flight is never interrupted -- being cut off between writing a
 * file and building it would leave a half-finished app -- so the last turn
 * can overshoot the plan. That trade only works if the user was told in
 * advance, and an app build runs to ~2,200 credits, so "in advance" has to
 * mean well before zero.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreditWarning } from './CreditWarning';
import { CreditStatus } from '../../hooks/useMessageStreaming';

const status = (over: Partial<CreditStatus> = {}): CreditStatus => ({
  used: 2400,
  limit: 3000,
  remaining: 600,
  percentage: 80,
  plan_name: 'Trial',
  reset_date: '2026-12-01T00:00:00+00:00',
  warn: true,
  exhausted: false,
  ...over,
});

beforeEach(() => {
  localStorage.clear();
});

describe('when there is nothing to say', () => {
  it('renders nothing without a status', () => {
    const { container } = render(<CreditWarning status={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing below the threshold', () => {
    const { container } = render(
      <CreditWarning status={status({ warn: false, used: 600, remaining: 2400 })} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the warning', () => {
  it('names what is left and what a build costs', () => {
    render(<CreditWarning status={status()} />);
    expect(screen.getByRole('status')).toHaveTextContent('600');
    expect(screen.getByRole('status')).toHaveTextContent('3,000');
    expect(screen.getByRole('status')).toHaveTextContent(/app build/i);
  });

  it('says the next message will fail once exhausted', () => {
    render(
      <CreditWarning
        status={status({ exhausted: true, remaining: 0, used: 3000, percentage: 100 })}
      />
    );
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent(/next message won't go through/i);
    // Not the "worth upgrading before you start one" advice -- too late.
    expect(banner).not.toHaveTextContent(/before you\s+start/i);
  });

  it('shows when the allowance comes back', () => {
    render(<CreditWarning status={status({ exhausted: true, remaining: 0 })} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Dec 1/);
  });
});

describe('dismissal', () => {
  it('hides the banner when dismissed', () => {
    render(<CreditWarning status={status()} />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays dismissed on a re-render at the same level', () => {
    const { unmount } = render(<CreditWarning status={status()} />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    unmount();

    render(<CreditWarning status={status({ remaining: 500, used: 2500 })} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('comes back when the credits actually run out', () => {
    const { unmount } = render(<CreditWarning status={status()} />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    unmount();

    // Dismissing "running low" must not hide "the next turn will fail".
    render(<CreditWarning status={status({ exhausted: true, remaining: 0 })} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

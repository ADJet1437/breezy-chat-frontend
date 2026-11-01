/**
 * The chat on a phone.
 *
 * The split is unusable there: at 390px the 35% floor leaves 136px of
 * conversation and 253px of artifact. So below the breakpoint the two
 * become one pane and a switch.
 *
 * What matters, and is easy to get wrong, is that switching HIDES rather
 * than unmounts. Unmounting the conversation loses its scroll position;
 * unmounting the app panel tears down the iframe, which reloads and
 * rebuilds the app every time someone looks at the chat.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mobile = { value: true };
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mobile.value }));
vi.mock('../deck/DeckPanel', () => ({
  DeckPanel: () => <div data-testid="deck-panel">deck</div>,
}));
vi.mock('../app/AppPanel', () => ({
  AppPanel: () => <div data-testid="app-panel">app</div>,
}));
vi.mock('./ChatMessageArea', () => ({
  ChatMessageArea: () => <div data-testid="messages">messages</div>,
}));
vi.mock('./ChatInputSection', () => ({
  ChatInputSection: () => <div data-testid="composer">composer</div>,
}));
vi.mock('../SubscriptionDialog', () => ({ default: () => null }));

import { ChatView } from './ChatView';

const props = {
  messages: [],
  isLoadingHistory: false,
  isStreaming: false,
  missionPhase: 'init' as const,
  currentStep: '',
  executionProgress: 0,
  inputValue: '',
  setInputValue: vi.fn(),
  onSendMessage: vi.fn(),
  onKeyPress: vi.fn(),
  onFilesUploaded: vi.fn(),
  attachedFileIds: [],
  attachedFileDetails: [],
  setAttachedFileIds: vi.fn(),
  setAttachedFileDetails: vi.fn(),
  showSubscriptionDialog: false,
  onSubscriptionDialogChange: vi.fn(),
  onSubscribed: vi.fn(),
  subscriptionMessage: '',
};

beforeEach(() => {
  mobile.value = true;
});

describe('with an app, on a phone', () => {
  it('offers a switch instead of a split', () => {
    render(<ChatView {...props} appId="a1" appSlug="todo" />);
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'App' })).toBeInTheDocument();
  });

  it('opens on the artifact, since that is the thing that just appeared', () => {
    render(<ChatView {...props} appId="a1" appSlug="todo" />);
    expect(screen.getByRole('button', { name: 'App' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('keeps both panes mounted so neither reloads when switching', () => {
    render(<ChatView {...props} appId="a1" appSlug="todo" />);
    // The app panel is an iframe in real life: unmounting rebuilds the app.
    expect(screen.getByTestId('app-panel')).toBeInTheDocument();
    expect(screen.getByTestId('messages')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.getByTestId('app-panel')).toBeInTheDocument();
    expect(screen.getByTestId('messages')).toBeInTheDocument();
  });

  it('switches which pane is shown', () => {
    render(<ChatView {...props} appId="a1" appSlug="todo" />);
    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.getByRole('button', { name: 'Chat' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'App' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('names the tab for the artifact it holds', () => {
    render(<ChatView {...props} deckId="d1" />);
    expect(screen.getByRole('button', { name: 'Slides' })).toBeInTheDocument();
  });
});

describe('without an artifact', () => {
  it('shows no switch at all', () => {
    render(<ChatView {...props} />);
    expect(screen.queryByRole('button', { name: 'Chat' })).toBeNull();
    expect(screen.getByTestId('messages')).toBeInTheDocument();
  });
});

describe('on a desktop', () => {
  it('keeps the resizable split', () => {
    mobile.value = false;
    render(<ChatView {...props} appId="a1" appSlug="todo" />);
    expect(screen.queryByRole('button', { name: 'Chat' })).toBeNull();
    expect(screen.getByTestId('app-panel')).toBeInTheDocument();
    expect(screen.getByTestId('messages')).toBeInTheDocument();
  });
});

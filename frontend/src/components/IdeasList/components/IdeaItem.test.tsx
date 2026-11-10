import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readCss } from '@/test/css';
import { makeIdea, renderWithProviders } from '@/test/utils';
import IdeaItem from './IdeaItem';

const styles = readCss('./IdeaItem.module.css', import.meta.url);

/** happy-dom does no layout, so the measurements the clamp check reads are stubbed: text taller than its box counts as cut. */
const stubCut = (cut: boolean) => {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => (cut ? 400 : 100));
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 100);
};

describe('IdeaItem read more', () => {
  afterEach(() => vi.restoreAllMocks());

  it('offers no toggle when the text fits in the visible lines', () => {
    stubCut(false);
    renderWithProviders(<IdeaItem idea={makeIdea({ description: 'A short quest.' })} />);

    expect(screen.queryByRole('button', { name: /read more|show less/i })).not.toBeInTheDocument();
  });

  it('offers Read more when the text is cut, and expands and collapses it', async () => {
    stubCut(true);
    const user = userEvent.setup();
    renderWithProviders(<IdeaItem idea={makeIdea({ description: 'A long quest. '.repeat(60) })} />);

    const toggle = screen.getByRole('button', { name: 'Read more' });
    const text = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(text).toHaveTextContent('A long quest.');
    expect(text).not.toHaveAttribute('data-expanded');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(text).toHaveAttribute('data-expanded');

    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByRole('button', { name: 'Read more' })).toHaveAttribute('aria-expanded', 'false');
    expect(text).not.toHaveAttribute('data-expanded');
  });

  it('scrolls the card into view as little as possible on Show less, and not on Read more', async () => {
    stubCut(true);
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <IdeaItem idea={makeIdea({ description: 'A long quest. '.repeat(60) })} />,
    );

    await user.click(screen.getByRole('button', { name: 'Read more' }));
    expect(scroll).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest' });
    expect(scroll.mock.contexts[0]).toBe(container.querySelector('[data-cast]'));
  });

  it('is reachable and operable with the keyboard, and keeps the focus on the same button', async () => {
    stubCut(true);
    const user = userEvent.setup();
    renderWithProviders(<IdeaItem idea={makeIdea({ description: 'A long quest. '.repeat(60) })} />);

    const toggle = screen.getByRole('button', { name: 'Read more' });
    await user.tab();
    expect(toggle).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('Show less');

    await user.keyboard(' ');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('IdeaItem read more re-measures', () => {
  const originalObserver = window.ResizeObserver;
  const fonts = document.fonts as unknown as { ready?: Promise<unknown> };
  const observers: { callback: () => void; targets: Element[] }[] = [];

  class CapturingObserver {
    private readonly entry: { callback: () => void; targets: Element[] };
    constructor(callback: () => void) {
      this.entry = { callback, targets: [] };
      observers.push(this.entry);
    }
    observe(target: Element) {
      this.entry.targets.push(target);
    }
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    observers.length = 0;
    window.ResizeObserver = CapturingObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    window.ResizeObserver = originalObserver;
    delete fonts.ready;
    vi.restoreAllMocks();
  });

  it('offers Read more when the text only grows past the clamp once the fonts are ready', async () => {
    // Before the web font arrives the text fits; afterwards it wraps to more lines than the clamp allows, while the clamped box keeps its height.
    let cut = false;
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => (cut ? 400 : 100));
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 100);
    let loaded: () => void = () => undefined;
    fonts.ready = new Promise<void>(resolve => {
      loaded = resolve;
    });

    renderWithProviders(<IdeaItem idea={makeIdea({ description: 'A long quest. '.repeat(60) })} />);
    expect(screen.queryByRole('button', { name: 'Read more' })).not.toBeInTheDocument();

    cut = true;
    loaded();
    expect(await screen.findByRole('button', { name: 'Read more' })).toBeInTheDocument();
  });

  it('re-measures when the card around the text changes width, not only when the text box does', async () => {
    let cut = false;
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => (cut ? 400 : 100));
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 100);

    renderWithProviders(<IdeaItem idea={makeIdea({ description: 'A long quest. '.repeat(60) })} />);
    expect(screen.queryByRole('button', { name: 'Read more' })).not.toBeInTheDocument();

    const text = document.querySelector('p[id]');
    const observer = observers.find(entry => entry.targets.includes(text as Element));
    expect(observer?.targets).toContain(text?.parentElement);

    cut = true;
    act(() => observer?.callback());
    expect(await screen.findByRole('button', { name: 'Read more' })).toBeInTheDocument();
  });
});

describe('IdeaItem vote buttons', () => {
  it('draws Back on wood and Reject on parchment, each with its label and its icon', () => {
    renderWithProviders(<IdeaItem idea={makeIdea({ score: 7 })} />);

    const back = screen.getByRole('button', { name: 'Back this quest' });
    const reject = screen.getByRole('button', { name: 'Reject this quest' });
    expect(back).toHaveAttribute('data-kind', 'back');
    expect(reject).toHaveAttribute('data-kind', 'reject');
    expect(back.querySelector('svg')).not.toBeNull();
    expect(reject.querySelector('svg')).not.toBeNull();
    expect(screen.getByTestId('score')).toHaveTextContent('Score: 7');
  });

  it('never hides the vote icons at any card width, so backing and rejecting stay apart at a glance', () => {
    // happy-dom does not run container queries, so the rule is checked in the stylesheet: no rule on the button icons may hide them.
    const iconRules = [...styles.matchAll(/\.button svg\s*\{([^}]*)\}/g)].map(match => match[1]);
    expect(iconRules.length).toBeGreaterThan(0);
    for (const rule of iconRules) expect(rule).not.toMatch(/display\s*:\s*none|visibility\s*:\s*hidden/);
  });

  it('keeps the accessible names on the vote buttons', () => {
    renderWithProviders(<IdeaItem idea={makeIdea()} />);

    expect(screen.getByRole('button', { name: 'Back this quest' })).toHaveTextContent('Back');
    expect(screen.getByRole('button', { name: 'Reject this quest' })).toHaveTextContent('Reject');
  });

  it('shows the pressed state of the vote the caller already cast', () => {
    renderWithProviders(<IdeaItem idea={makeIdea({ myVote: -1 })} />);

    expect(screen.getByRole('button', { name: 'Back this quest' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Reject this quest' })).toHaveAttribute('aria-pressed', 'true');
  });
});

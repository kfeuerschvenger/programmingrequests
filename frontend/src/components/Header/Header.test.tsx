import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalsProvider } from '@mantine/modals';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Header } from './Header';

const renderHeader = () =>
  renderWithProviders(
    <ModalsProvider>
      <Header />
    </ModalsProvider>,
  );

describe('Header', () => {
  it('names the product in the one h1, a link home, as real text on the sign', () => {
    renderHeader();

    const title = screen.getByRole('heading', { level: 1, name: 'Code Quests' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(title).getByRole('link', { name: 'Code Quests' })).toHaveAttribute('href', '/');
  });

  it('writes the tagline on two lines, one sentence each', () => {
    renderHeader();

    const lines = screen.getByText('Post a quest.').parentElement;
    expect(lines).toBe(screen.getByText('Let the hero code.').parentElement);
    const spans = [...(lines?.children ?? [])];
    expect(spans.map(span => span.textContent)).toEqual(['Post a quest.', 'Let the hero code.']);
    // Each sentence is its own element, and the stylesheet makes every one a block, so the break does not depend on the viewport.
    expect(spans.every(span => span.tagName === 'SPAN')).toBe(true);
  });

  it('keeps the two controls out of the sign and the decorations out of the accessibility tree', () => {
    const { container } = renderHeader();

    const title = screen.getByRole('heading', { level: 1 });
    const sign = title.parentElement as HTMLElement;
    expect(within(sign).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voting rules' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    for (const decoration of container.querySelectorAll('img'))
      expect(decoration).toHaveAttribute('aria-hidden', 'true');
  });

  it('opens the voting rules on a sheet of parchment and closes them with the button', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Voting rules' }));

    const dialog = await screen.findByRole('dialog', { name: 'Voting rules' });
    expect(dialog).toHaveTextContent(/In this realm of choices, you wield the power of a single vote per quest/);
    await user.click(screen.getByRole('button', { name: 'I accept my destiny' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'I accept my destiny' })).not.toBeInTheDocument());
  });

  it('labels the colour scheme switch with the scheme it switches to', async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' });
    await user.click(toggle);
    expect(await screen.findByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });
});

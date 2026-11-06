import { screen, waitFor } from '@testing-library/react';
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
  it('names the product in a link home, with a decorative mark', () => {
    renderHeader();

    const brand = screen.getByRole('link', { name: 'Code Quests' });
    expect(brand).toHaveAttribute('href', '/');
    expect(brand.querySelector('img')).toHaveAttribute('alt', '');
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

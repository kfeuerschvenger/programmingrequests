import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Logo } from './Logo';

describe('Logo', () => {
  it('exposes the product name as its accessible name', () => {
    renderWithProviders(<Logo />);

    const logo = screen.getByRole('img', { name: 'Code Quests' });
    expect(logo).toHaveAttribute('src');
    expect(logo.getAttribute('src')).toMatch(/svg/);
  });

  it('keeps the header variant at a fixed 28px size', () => {
    renderWithProviders(<Logo variant="header" />);

    const logo = screen.getByRole('img', { name: 'Code Quests' });
    expect(logo.getAttribute('style')).toMatch(/height: calc\(1\.75rem/);
    expect(logo.getAttribute('style')).toMatch(/width: calc\(1\.75rem/);
  });
});

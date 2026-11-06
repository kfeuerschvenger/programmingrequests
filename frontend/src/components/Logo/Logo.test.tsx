import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Logo } from './Logo';

describe('Logo', () => {
  it.each(['header', 'footer'] as const)('exposes the product name and an image source in the %s variant', variant => {
    renderWithProviders(<Logo variant={variant} />);

    const logo = screen.getByRole('img', { name: 'Code Quests' });
    expect(logo.getAttribute('src')).toBeTruthy();
  });

  it('is hidden from assistive technology when it is decorative', () => {
    const { container } = renderWithProviders(<Logo variant="header" decorative />);

    expect(screen.queryByRole('img', { name: 'Code Quests' })).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});

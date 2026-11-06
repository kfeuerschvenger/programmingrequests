import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Footer } from './Footer';

describe('Footer', () => {
  it('credits the author and links to GitHub, LinkedIn and the portfolio, opening safely in a new tab', () => {
    renderWithProviders(<Footer />);

    expect(screen.getByText(/Built with care by/)).toHaveTextContent('Built with care by Kevin Feuerschvenger');
    const expected = {
      GitHub: 'https://github.com/kfeuerschvenger',
      LinkedIn: 'https://www.linkedin.com/in/kevin-feuerschvenger/',
      Portfolio: 'https://feuerschvenger.com/',
    };
    for (const [name, href] of Object.entries(expected)) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('has no email link, no year and no emoji', () => {
    renderWithProviders(<Footer />);

    expect(screen.queryByRole('link', { name: /mail/i })).not.toBeInTheDocument();
    const text = screen.getByRole('contentinfo').textContent ?? '';
    expect(text).not.toMatch(/\b20\d{2}\b/);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

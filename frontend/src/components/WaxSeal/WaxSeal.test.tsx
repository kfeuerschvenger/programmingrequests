import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { sealSize, sealText } from './sealText';
import { WaxSeal } from './WaxSeal';

describe('sealText', () => {
  it('writes a true minus sign for a negative score', () => {
    expect(sealText(-3)).toBe('−3');
    expect(sealText(0)).toBe('0');
    expect(sealText(128)).toBe('128');
  });

  it('shrinks the digits as the score grows', () => {
    expect(sealSize('42')).toBe('md');
    expect(sealSize('128')).toBe('sm');
    expect(sealSize('1280')).toBe('xs');
  });
});

describe('WaxSeal', () => {
  it('is a polite live region that announces the score', () => {
    renderWithProviders(<WaxSeal value={7} testId="seal" />);

    const live = screen.getByTestId('seal');
    expect(live).toHaveAttribute('role', 'status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Score: 7');
  });

  it('is stamped again only when the score changes, and keeps the same live region', () => {
    const { rerender } = renderWithProviders(<WaxSeal value={7} testId="seal" />);
    const live = screen.getByTestId('seal');
    expect(live.querySelector('[data-stamped]')).toBeNull();

    rerender(<WaxSeal value={7} testId="seal" />);
    expect(live.querySelector('[data-stamped]')).toBeNull();

    rerender(<WaxSeal value={8} testId="seal" />);
    expect(screen.getByTestId('seal')).toBe(live);
    expect(live.querySelector('[data-stamped]')).not.toBeNull();
    expect(live).toHaveTextContent('Score: 8');
  });
});

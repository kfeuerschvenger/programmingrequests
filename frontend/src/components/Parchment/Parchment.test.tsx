import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Parchment } from './Parchment';
import { CARD_TEARS, SHEET_TEARS, tearFor, tiltFor } from './tears';

describe('tears', () => {
  it('is deterministic for a seed', () => {
    expect(tiltFor(42)).toBe(tiltFor(42));
    expect(tearFor(42, 'card')).toBe(tearFor(42, 'card'));
  });

  it('keeps the lean within a degree and a half and the outline within the precomputed set', () => {
    for (let seed = 0; seed < 500; seed += 1) {
      expect(Math.abs(tiltFor(seed))).toBeLessThanOrEqual(1.5);
      expect(tearFor(seed, 'card')).toBeLessThan(CARD_TEARS);
      expect(tearFor(seed, 'sheet')).toBeLessThan(SHEET_TEARS);
    }
  });

  it('uses every card outline across many seeds', () => {
    const used = new Set(Array.from({ length: 200 }, (_, seed) => tearFor(seed, 'card')));
    expect(used.size).toBe(CARD_TEARS);
  });
});

describe('Parchment', () => {
  it('renders its children, a pin when asked, and the outline chosen by the seed', () => {
    render(
      <Parchment as="article" seed={7} pinned aria-label="A notice">
        <p>Quest text</p>
      </Parchment>,
    );

    const notice = screen.getByRole('article', { name: 'A notice' });
    expect(notice).toHaveTextContent('Quest text');
    expect(notice).toHaveAttribute('data-tear', String(tearFor(7, 'card')));
    expect(notice.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('hangs straight when it does not lean and leaves out the pin by default', () => {
    render(
      <Parchment kind="sheet" seed={3} leans={false} data-testid="sheet">
        <p>Plain</p>
      </Parchment>,
    );

    const sheet = screen.getByTestId('sheet');
    expect(sheet.style.getPropertyValue('--tilt')).toBe('0deg');
    expect(sheet.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(sheet).toHaveAttribute('data-kind', 'sheet');
  });
});

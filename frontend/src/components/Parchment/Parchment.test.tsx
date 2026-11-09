import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  COMMON_FASTENERS,
  DAGGER_ONE_IN,
  STAIN_PLACES,
  fastenerFor,
  fastenerXFor,
  stainFor,
  tiltFor,
  type FastenerKind,
} from './fasteners';
import { Parchment } from './Parchment';

const ids = Array.from({ length: 600 }, (_, id) => id + 1);

describe('tilt', () => {
  it('is the same for the same id and stays within a degree and a half', () => {
    expect(tiltFor(42)).toBe(tiltFor(42));
    for (const id of ids) expect(Math.abs(tiltFor(id))).toBeLessThanOrEqual(1.5);
  });

  it('differs between ids, so the cards do not all lean together', () => {
    expect(new Set(ids.map(id => tiltFor(id).toFixed(2))).size).toBeGreaterThan(50);
  });
});

describe('fastenerFor', () => {
  it('is the same for the same id and one of the six known fasteners', () => {
    const known: FastenerKind[] = [...COMMON_FASTENERS, 'dagger-stuck'];
    for (const id of ids) {
      expect(fastenerFor(id)).toBe(fastenerFor(id));
      expect(known).toContain(fastenerFor(id));
    }
  });

  it('uses every ordinary fastener, and the dagger on roughly one card in eleven', () => {
    const counts = new Map<FastenerKind, number>();
    for (const id of ids) counts.set(fastenerFor(id), (counts.get(fastenerFor(id)) ?? 0) + 1);

    for (const kind of COMMON_FASTENERS) expect(counts.get(kind) ?? 0).toBeGreaterThan(0);
    const daggers = counts.get('dagger-stuck') ?? 0;
    expect(daggers).toBeGreaterThan(0);
    expect(daggers).toBeLessThan((ids.length / DAGGER_ONE_IN) * 2);
  });

  it('places the fastener between 40% and 60% of the width, at slightly different spots', () => {
    const spots = ids.map(fastenerXFor);
    expect(Math.min(...spots)).toBeGreaterThanOrEqual(40);
    expect(Math.max(...spots)).toBeLessThanOrEqual(60);
    expect(new Set(spots).size).toBeGreaterThan(10);
  });
});

describe('stainFor', () => {
  it('is the same for the same id', () => {
    for (const id of ids) expect(stainFor(id)).toEqual(stainFor(id));
  });

  it('stains roughly one quest in three, with every blot and every place in use', () => {
    const stains = ids.map(stainFor).filter(stain => stain !== null);

    expect(stains.length).toBeGreaterThan(ids.length * 0.25);
    expect(stains.length).toBeLessThan(ids.length * 0.42);
    expect(new Set(stains.map(stain => stain.blot))).toEqual(new Set([1, 2, 3]));
    expect(new Set(stains.map(stain => stain.place))).toEqual(new Set(STAIN_PLACES));
  });

  it('keeps every stain small and its side position inside the middle of the side', () => {
    for (const stain of ids.map(stainFor)) {
      if (!stain) continue;
      expect(stain.scale).toBeGreaterThanOrEqual(0.85);
      expect(stain.scale).toBeLessThanOrEqual(1.15);
      expect(stain.at).toBeGreaterThanOrEqual(25);
      expect(stain.at).toBeLessThanOrEqual(75);
    }
  });
});

describe('Parchment', () => {
  it('soaks a hidden ink stain into the quests its seed picks, and into no other paper', () => {
    const stained = ids.find(id => stainFor(id));
    const clean = ids.find(id => !stainFor(id));
    render(
      <>
        <Parchment seed={stained} stained data-testid="stained">
          <p>Quest</p>
        </Parchment>
        <Parchment seed={clean} stained data-testid="clean">
          <p>Quest</p>
        </Parchment>
        <Parchment seed={stained} data-testid="unmarked">
          <p>Quest</p>
        </Parchment>
      </>,
    );

    const stain = screen.getByTestId('stained').querySelector('img[src*="ink-blot"]');
    expect(stain).toHaveAttribute('aria-hidden', 'true');
    expect(stain).toHaveAttribute('alt', '');
    expect(stain).toHaveAttribute('data-stain', stainFor(stained ?? 0)?.place);
    expect(screen.getByTestId('clean').querySelector('img')).toBeNull();
    expect(screen.getByTestId('unmarked').querySelector('img')).toBeNull();
  });

  it('renders its children and the fastener its seed picks, hidden from assistive technology', () => {
    render(
      <Parchment seed={7} pinned aria-label="A notice" role="article">
        <p>Quest text</p>
      </Parchment>,
    );

    const notice = screen.getByRole('article', { name: 'A notice' });
    expect(notice).toHaveTextContent('Quest text');
    const fastener = notice.querySelector('img');
    expect(fastener).toHaveAttribute('data-fastener', fastenerFor(7));
    expect(fastener).toHaveAttribute('aria-hidden', 'true');
    expect(fastener).toHaveAttribute('alt', '');
    expect(notice.style.getPropertyValue('--tilt')).toBe(`${tiltFor(7).toFixed(2)}deg`);
  });

  it('takes the fasteners it is given instead of the seeded one', () => {
    render(
      <Parchment kind="sheet" fasteners={[{ kind: 'nail-flush', x: 9 }, { kind: 'dagger-stuck' }]} data-testid="sheet">
        <p>Form</p>
      </Parchment>,
    );

    const kinds = [...screen.getByTestId('sheet').querySelectorAll('img')].map(img => img.dataset.fastener);
    expect(kinds).toEqual(['nail-flush', 'dagger-stuck']);
  });

  it('hangs straight when it does not lean and has no fastener by default', () => {
    render(
      <Parchment kind="sheet" seed={3} leans={false} data-testid="sheet">
        <p>Plain</p>
      </Parchment>,
    );

    const sheet = screen.getByTestId('sheet');
    expect(sheet.style.getPropertyValue('--tilt')).toBe('0deg');
    expect(sheet.querySelector('img')).toBeNull();
    expect(sheet).toHaveAttribute('data-kind', 'sheet');
  });
});

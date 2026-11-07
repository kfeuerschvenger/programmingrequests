import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { castShadows, measureSources, placePools } from './lightLayout';

const rect = (left: number, top: number, width: number, height: number) => new DOMRect(left, top, width, height);

const place = (element: Element, box: DOMRect) => {
  element.getBoundingClientRect = () => box;
};

describe('light layout', () => {
  let board: HTMLDivElement;

  beforeEach(() => {
    board = document.createElement('div');
    place(board, rect(100, 0, 1000, 3000));
    document.body.append(board);
  });

  afterEach(() => {
    board.remove();
  });

  const addFlame = (id: string, box: DOMRect) => {
    const flame = document.createElement('span');
    flame.dataset.lightSource = id;
    place(flame, box);
    board.append(flame);
  };

  const addCard = (box: DOMRect) => {
    const card = document.createElement('div');
    card.dataset.cast = '';
    place(card, box);
    board.append(card);
    return card;
  };

  it('centres a source on its flame and falls back to the board edge when its prop is hidden', () => {
    addFlame('torch', rect(150, 300, 70, 100));

    const sources = measureSources(board);

    expect(sources.torch).toEqual({ x: 185, y: 350 });
    expect(sources.lantern.x).toBeGreaterThan(1000);
    expect(sources.candle.y).toBeGreaterThan(0);
  });

  it('writes the position of each pool relative to the board', () => {
    addFlame('torch', rect(150, 300, 70, 100));
    const layer = document.createElement('div');

    placePools(board, [layer]);

    expect(layer.style.getPropertyValue('--torch-x')).toBe('85.0px');
    expect(layer.style.getPropertyValue('--torch-y')).toBe('350.0px');
    expect(layer.style.getPropertyValue('--lantern-x')).not.toBe('');
    expect(layer.style.getPropertyValue('--candle-x')).not.toBe('');
  });

  it('points the shadow of a card away from the nearest light at night', () => {
    addFlame('torch', rect(100, 400, 20, 20));
    addFlame('lantern', rect(1080, 400, 20, 20));
    const nearTorch = addCard(rect(300, 400, 200, 100));
    const nearLantern = addCard(rect(700, 400, 200, 100));

    castShadows(board, true);

    // A card to the right of the torch is shadowed to its right, a card to the left of the lantern to its left.
    expect(parseFloat(nearTorch.style.getPropertyValue('--cq-shadow-x'))).toBeGreaterThan(5);
    expect(parseFloat(nearLantern.style.getPropertyValue('--cq-shadow-x'))).toBeLessThan(-5);
    for (const card of [nearTorch, nearLantern]) {
      const x = parseFloat(card.style.getPropertyValue('--cq-shadow-x'));
      const y = parseFloat(card.style.getPropertyValue('--cq-shadow-y'));
      expect(Math.hypot(x, y)).toBeCloseTo(9, 0);
    }
  });

  it('shadows a card below a light downward, and one above it upward', () => {
    addFlame('torch', rect(590, 1000, 20, 20));
    const below = addCard(rect(500, 1400, 200, 100));
    const above = addCard(rect(500, 200, 200, 100));

    castShadows(board, true);

    expect(parseFloat(below.style.getPropertyValue('--cq-shadow-y'))).toBeGreaterThan(5);
    expect(parseFloat(above.style.getPropertyValue('--cq-shadow-y'))).toBeLessThan(-5);
  });

  it('clears the shadow variables by day, so the sun in the top left casts every shadow down and to the right', () => {
    addFlame('torch', rect(100, 400, 20, 20));
    const card = addCard(rect(300, 400, 200, 100));
    castShadows(board, true);
    expect(card.style.getPropertyValue('--cq-shadow-x')).not.toBe('');

    castShadows(board, false);

    expect(card.style.getPropertyValue('--cq-shadow-x')).toBe('');
    expect(card.style.getPropertyValue('--cq-shadow-y')).toBe('');
  });
});

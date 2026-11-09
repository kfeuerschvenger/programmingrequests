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
    expect(sources.lantern?.x).toBeGreaterThan(1000);
    expect(sources.candle?.y).toBeGreaterThan(0);
  });

  it('measures and places only the sources it is asked for', () => {
    addFlame('torch', rect(150, 300, 70, 100));
    const layer = document.createElement('div');

    expect(Object.keys(measureSources(board, ['candle']))).toEqual(['candle']);
    placePools(board, [layer], ['candle']);

    expect(layer.style.getPropertyValue('--candle-x')).not.toBe('');
    expect(layer.style.getPropertyValue('--torch-x')).toBe('');
    expect(layer.style.getPropertyValue('--lantern-x')).toBe('');
  });

  it('casts shadows away from the sources that are drawn, and ignores a source that is not', () => {
    addFlame('torch', rect(100, 400, 20, 20));
    addFlame('candle', rect(900, 400, 20, 20));
    const card = addCard(rect(300, 400, 200, 100));

    castShadows(board, true, ['candle']);

    // The torch is nearer, but only the candle is lit: the shadow falls to the left, away from it.
    expect(parseFloat(card.style.getPropertyValue('--cq-shadow-x'))).toBeLessThan(-5);
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

  it('measures every card before it writes any, so no read follows a write', () => {
    addFlame('torch', rect(100, 400, 20, 20));
    const events: string[] = [];
    for (const top of [300, 700, 1100]) {
      const card = addCard(rect(300, top, 200, 100));
      const measure = card.getBoundingClientRect;
      card.getBoundingClientRect = () => {
        events.push('read');
        return measure.call(card);
      };
      const setProperty = card.style.setProperty.bind(card.style);
      card.style.setProperty = (name: string, value: string | null) => {
        events.push('write');
        setProperty(name, value);
      };
    }

    castShadows(board, true);

    expect(events.indexOf('write')).toBe(events.lastIndexOf('read') + 1);
  });

  it('does not write a shadow that has not changed', () => {
    addFlame('torch', rect(100, 400, 20, 20));
    const card = addCard(rect(300, 400, 200, 100));
    castShadows(board, true);
    let writes = 0;
    const setProperty = card.style.setProperty.bind(card.style);
    card.style.setProperty = (name: string, value: string | null) => {
      writes += 1;
      setProperty(name, value);
    };

    castShadows(board, true);
    expect(writes).toBe(0);

    place(card, rect(300, 900, 200, 100));
    castShadows(board, true);
    expect(writes).toBe(2);
  });

  it('shadows the cards of the scene and of an open dialog, and leaves any other card alone', () => {
    addFlame('torch', rect(100, 400, 20, 20));
    const inScene = addCard(rect(300, 400, 200, 100));
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const inDialog = document.createElement('div');
    inDialog.dataset.cast = '';
    place(inDialog, rect(600, 400, 200, 100));
    dialog.append(inDialog);
    const elsewhere = document.createElement('div');
    elsewhere.dataset.cast = '';
    place(elsewhere, rect(600, 900, 200, 100));
    document.body.append(dialog, elsewhere);

    castShadows(board, true);

    expect(inScene.style.getPropertyValue('--cq-shadow-x')).not.toBe('');
    expect(inDialog.style.getPropertyValue('--cq-shadow-x')).not.toBe('');
    expect(elsewhere.style.getPropertyValue('--cq-shadow-x')).toBe('');
    dialog.remove();
    elsewhere.remove();
  });
});

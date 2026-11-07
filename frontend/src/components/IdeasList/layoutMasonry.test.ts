import { describe, expect, it } from 'vitest';
import { columnsFor, layoutMasonry, THREE_COLUMNS_FROM, TWO_COLUMNS_FROM } from './layoutMasonry';

describe('columnsFor', () => {
  it('uses one column on a narrow board, two on a medium one and three on a wide one', () => {
    expect(columnsFor(320)).toBe(1);
    expect(columnsFor(TWO_COLUMNS_FROM - 1)).toBe(1);
    expect(columnsFor(TWO_COLUMNS_FROM)).toBe(2);
    expect(columnsFor(THREE_COLUMNS_FROM - 1)).toBe(2);
    expect(columnsFor(THREE_COLUMNS_FROM)).toBe(3);
  });
});

describe('layoutMasonry', () => {
  const heights = [300, 120, 200, 90, 260, 140, 180];

  it('deals the items out round robin, so reading across the columns follows the list', () => {
    const { placements } = layoutMasonry(heights, 3, 300, 10);

    expect(placements.map(p => p.column)).toEqual([0, 1, 2, 0, 1, 2, 0]);
    // The first row, read left to right, is items 0, 1, 2; the second row is 3, 4, 5.
    expect(placements.slice(0, 3).map(p => p.x)).toEqual([0, 310, 620]);
    expect(placements.slice(3, 6).map(p => p.x)).toEqual([0, 310, 620]);
  });

  it('stacks each item below the one above it in its column, with the gap between', () => {
    const { placements, height } = layoutMasonry(heights, 3, 300, 10);

    expect(placements[0]?.y).toBe(0);
    expect(placements[3]?.y).toBe(300 + 10);
    expect(placements[6]?.y).toBe(300 + 10 + 90 + 10);
    expect(placements[4]?.y).toBe(120 + 10);
    // The tallest column is column 0: 300 + 90 + 180 plus two gaps.
    expect(height).toBe(300 + 90 + 180 + 20);
  });

  it('keeps every placed item where it is when more items are appended', () => {
    const before = layoutMasonry(heights, 3, 300, 10).placements;
    const after = layoutMasonry([...heights, 220, 100, 310, 150], 3, 300, 10).placements;

    expect(after.slice(0, heights.length)).toEqual(before);
  });

  it('puts everything in one column on a narrow board', () => {
    const { placements, height } = layoutMasonry([100, 50, 70], 1, 280, 8);

    expect(placements.map(p => [p.column, p.x, p.y])).toEqual([
      [0, 0, 0],
      [0, 0, 108],
      [0, 0, 166],
    ]);
    expect(height).toBe(100 + 50 + 70 + 16);
  });

  it('is empty for no items', () => {
    expect(layoutMasonry([], 3, 300, 10)).toEqual({ placements: [], height: 0 });
  });
});

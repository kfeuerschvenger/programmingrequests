/** Container widths, in pixels, at which the board goes from one column to two and from two to three. */
export const TWO_COLUMNS_FROM = 560;
export const THREE_COLUMNS_FROM = 960;

export const columnsFor = (width: number) => (width >= THREE_COLUMNS_FROM ? 3 : width >= TWO_COLUMNS_FROM ? 2 : 1);

export interface Placement {
  column: number;
  x: number;
  y: number;
}

export interface MasonryLayout {
  placements: Placement[];
  /** Height of the tallest column. */
  height: number;
}

/**
 * Round robin: item i goes in column i mod n, below whatever is already in that column.
 * The column an item lands in depends only on its index, and its height position only on the items above it in that column, so appending items never moves the ones already placed.
 * Reading across the rows therefore follows the order of the list, which a balanced "shortest column first" layout does not guarantee.
 */
export function layoutMasonry(
  heights: readonly number[],
  columns: number,
  columnWidth: number,
  gap: number,
): MasonryLayout {
  const bottoms: number[] = Array.from({ length: columns }, () => 0);
  const placements = heights.map((height, index) => {
    const column = index % columns;
    const y = bottoms[column] ?? 0;
    bottoms[column] = y + height + gap;
    return { column, x: column * (columnWidth + gap), y };
  });
  return { placements, height: Math.max(0, ...bottoms.map(bottom => Math.max(0, bottom - gap))) };
}

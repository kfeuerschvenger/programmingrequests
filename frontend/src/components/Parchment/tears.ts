export const CARD_TEARS = 6;
export const SHEET_TEARS = 2;

export type ParchmentKind = 'card' | 'sheet';

/** A small integer hash, so neighbouring ids do not get neighbouring looks. */
export const scramble = (seed: number) => Math.imul(Math.trunc(seed) ^ 0x9e3779b9, 2654435761) >>> 0;

/** The lean, in degrees, from -1.5 to 1.5. */
export const tiltFor = (seed: number) => (scramble(seed + 7) % 301) / 100 - 1.5;

/** Which of the precomputed torn outlines a seed uses. */
export const tearFor = (seed: number, kind: ParchmentKind) =>
  scramble(seed) % (kind === 'card' ? CARD_TEARS : SHEET_TEARS);

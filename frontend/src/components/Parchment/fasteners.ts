export type FastenerKind = 'nail-flush' | 'nail-half' | 'nail-angled' | 'nail-bent' | 'pin-brass' | 'dagger-stuck';

export type ParchmentKind = 'card' | 'sheet';

/** The ordinary fasteners. The dagger is kept apart because it is rare. */
export const COMMON_FASTENERS: readonly FastenerKind[] = [
  'nail-flush',
  'nail-half',
  'nail-angled',
  'nail-bent',
  'pin-brass',
];

/** One card in this many is stuck with the dagger. */
export const DAGGER_ONE_IN = 11;

/** A small integer hash, so neighbouring ids do not get neighbouring looks. */
export const scramble = (seed: number) => Math.imul(Math.trunc(seed) ^ 0x9e3779b9, 2654435761) >>> 0;

/** The lean, in degrees, from -1.5 to 1.5. */
export const tiltFor = (seed: number) => (scramble(seed + 7) % 301) / 100 - 1.5;

/** Which fastener holds the card with this id. The same id always gets the same one. */
export const fastenerFor = (seed: number): FastenerKind => {
  const hash = scramble(seed + 101);
  if (hash % DAGGER_ONE_IN === 0) return 'dagger-stuck';
  return COMMON_FASTENERS[(hash >>> 5) % COMMON_FASTENERS.length] ?? 'nail-flush';
};

/** Where along the top edge the fastener goes, as a percentage of the card width, from 40 to 60. */
export const fastenerXFor = (seed: number) => 40 + (scramble(seed + 57) % 21);

/** Where on the paper a stain soaks in: over a corner, or over the middle of a side. Never over the text. */
export type StainPlace = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right';

export const STAIN_PLACES: readonly StainPlace[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'left',
  'right',
];

/** One quest in this many is stained with ink. */
export const STAIN_ONE_IN = 3;

export interface Stain {
  /** Which of the three ink blots. */
  blot: 1 | 2 | 3;
  place: StainPlace;
  /** Turn of the blot, in degrees. */
  turn: number;
  /** Size as a share of the base size, from 0.85 to 1.15. */
  scale: number;
  /** For a stain on a side: how far down that side it sits, as a percentage of the height, from 25 to 75. */
  at: number;
}

/** The ink stain of the card with this id, or null for the two cards in three that have none. The same id always gets the same answer. */
export const stainFor = (seed: number): Stain | null => {
  const hash = scramble(seed + 331);
  if ((hash >>> 9) % STAIN_ONE_IN !== 0) return null;
  const more = scramble(seed + 977);
  return {
    blot: ((more % 3) + 1) as Stain['blot'],
    place: STAIN_PLACES[(more >>> 4) % STAIN_PLACES.length] ?? 'top-left',
    turn: (more >>> 8) % 360,
    scale: 0.85 + ((more >>> 12) % 31) / 100,
    at: 25 + ((more >>> 17) % 51),
  };
};

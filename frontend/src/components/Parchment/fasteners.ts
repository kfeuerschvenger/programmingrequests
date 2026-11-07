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

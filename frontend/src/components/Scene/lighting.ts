/** The night scene has three fire sources. Each flickers on its own phase so the pools never pulse together. */
export type LightId = 'torch' | 'lantern' | 'candle';

export interface LightSource {
  id: LightId;
  /** Offset into the noise, in seconds, so the sources are never in step. */
  phase: number;
  /** How fast the flame wanders. A torch roars, a candle breathes. */
  speed: number;
  /** The dimmest intensity the source reaches, from 0 to 1. The brightest is 1. */
  floor: number;
}

export const LIGHT_SOURCES: readonly LightSource[] = [
  { id: 'torch', phase: 0, speed: 1.35, floor: 0.74 },
  { id: 'lantern', phase: 41.7, speed: 0.8, floor: 0.82 },
  { id: 'candle', phase: 17.3, speed: 1.1, floor: 0.7 },
];

/** Updates per second. Fast enough to read as fire, slow enough to leave the main thread idle between them. */
export const FLICKER_HZ = 20;

/** Updates per second on a narrow screen or a weak device: a phone repaints less often and the fire still reads as fire. */
export const LOW_FLICKER_HZ = 12;

/** Screens narrower than this, in pixels, run the fire at LOW_FLICKER_HZ. */
export const NARROW_QUERY = '(max-width: 639px)';

/** A device that reports two cores or fewer, or 2 GB of memory or less, is treated as low powered. Browsers that report neither are not. */
export const isLowPower = (): boolean => {
  const { hardwareConcurrency, deviceMemory } = navigator as Navigator & { deviceMemory?: number };
  return (
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 2) || (deviceMemory !== undefined && deviceMemory <= 2)
  );
};

/** How many times a second the light is rewritten. */
export const flickerRate = (narrow: boolean, lowPower: boolean): number =>
  narrow || lowPower ? LOW_FLICKER_HZ : FLICKER_HZ;

/** The time, in seconds, a static scene is frozen at. Reduced motion shows this moment instead of a loop. */
export const STATIC_TIME = 3.1;

const lattice = (index: number) => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Smooth one dimensional value noise in the range 0 to 1: random values on whole numbers, eased between them. */
export function smoothNoise(x: number): number {
  const cell = Math.floor(x);
  const t = x - cell;
  const eased = t * t * (3 - 2 * t);
  return lattice(cell) * (1 - eased) + lattice(cell + 1) * eased;
}

export interface LightState {
  /** Opacity of the light pool, from the source floor to 1. */
  intensity: number;
  /** Scale of the pool: the light breathes a few percent wider as it brightens. */
  radius: number;
}

/** The state of one source at a time in seconds. Two octaves: a slow swell and a quick flutter. */
export function lightAt(source: LightSource, seconds: number): LightState {
  const t = seconds * source.speed + source.phase;
  const wander = 0.62 * smoothNoise(t * 0.9) + 0.38 * smoothNoise(t * 3.7 + 9.1);
  return {
    intensity: source.floor + (1 - source.floor) * wander,
    radius: 0.96 + 0.07 * wander,
  };
}

/** Writes every source's state onto the elements as custom properties, which the pool styles read. */
export function applyLights(targets: readonly HTMLElement[], seconds: number): void {
  for (const source of LIGHT_SOURCES) {
    const { intensity, radius } = lightAt(source, seconds);
    for (const target of targets) {
      target.style.setProperty(`--${source.id}-i`, intensity.toFixed(3));
      target.style.setProperty(`--${source.id}-r`, radius.toFixed(3));
    }
  }
}

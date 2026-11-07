import { useEffect, type RefObject } from 'react';
import { applyLights, FLICKER_HZ, STATIC_TIME } from './lighting';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Drives the fire. One requestAnimationFrame loop for the whole scene, throttled to FLICKER_HZ updates a second, writes each source's intensity and radius as custom properties on the given elements.
 * The loop does nothing while the tab is hidden, and under reduced motion it never starts: the sources are frozen at one moment instead.
 */
export function useLightFlicker(targets: readonly RefObject<HTMLElement | null>[], active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const elements = () => targets.map(target => target.current).filter((element): element is HTMLElement => !!element);
    const reduced = window.matchMedia(REDUCED_MOTION);
    const interval = 1000 / FLICKER_HZ;
    let frame = 0;
    let last = -Infinity;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < interval) return;
      last = now;
      applyLights(elements(), now / 1000);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const start = () => {
      stop();
      applyLights(elements(), STATIC_TIME);
      if (reduced.matches || document.hidden) return;
      last = -Infinity;
      frame = requestAnimationFrame(tick);
    };

    start();
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', start);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', start);
      reduced.removeEventListener('change', start);
    };
  }, [targets, active]);
}

import { useEffect, type RefObject } from 'react';
import { LAYOUT_EVENT } from './lightLayout';
import { applyLights, flickerRate, isLowPower, NARROW_QUERY, STATIC_TIME, type LightId } from './lighting';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** How far outside the viewport, in pixels, a flame still lights something that is on screen. */
const GLOW_REACH = 300;

/**
 * Drives the fire. One timer for the whole scene, at the flicker rate, writes each source's intensity and radius as custom properties on the given elements.
 * It is a timer and not an animation frame loop on purpose: a frame callback keeps the page producing a frame at every refresh, 60 a second, to change the light 12 or 20 times a second. With a timer the page makes a frame only when the light has changed.
 * The loop runs only while a flame is on screen or near it: it stops when the tab is hidden and when every flame has scrolled out of view, and under reduced motion it never starts, so the sources are frozen at one moment instead.
 * The same states set `--<source>-play` on the elements, which the flame sprites read as their animation play state, so an unseen flame is not stepped either.
 * The rate is lower on a narrow screen or a weak device.
 */
export function useLightFlicker(
  targets: readonly RefObject<HTMLElement | null>[],
  active: boolean,
  scene: HTMLElement | null = null,
): void {
  useEffect(() => {
    if (!active) return;

    const elements = () => targets.map(target => target.current).filter((element): element is HTMLElement => !!element);
    const reduced = window.matchMedia(REDUCED_MOTION);
    const narrow = window.matchMedia(NARROW_QUERY);
    const lowPower = isLowPower();
    let interval = 1000 / flickerRate(narrow.matches, lowPower);
    let timer = 0;

    // Whether each flame is on screen. A flame that has not been reported yet counts as on screen, and so does a scene whose flames are not drawn: the pools then shine from their fallback positions.
    const flames = new Map<Element, boolean>();
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            entries => {
              for (const entry of entries) flames.set(entry.target, entry.isIntersecting);
              sync();
            },
            { rootMargin: `${GLOW_REACH}px` },
          );

    const flameOn = (id: LightId) => {
      const anchors = [...flames].filter(([element]) => (element as HTMLElement).dataset.lightSource === id);
      return anchors.length === 0 || anchors.some(([, visible]) => visible);
    };
    const anyFlameOn = () => flames.size === 0 || [...flames.values()].some(Boolean);

    const watchFlames = () => {
      for (const element of [...flames.keys()]) {
        if (!element.isConnected) {
          flames.delete(element);
          observer?.unobserve(element);
        }
      }
      scene?.querySelectorAll<HTMLElement>('[data-light-source]').forEach(element => {
        if (flames.has(element)) return;
        flames.set(element, true);
        observer?.observe(element);
      });
    };

    const tick = () => {
      timer = window.setTimeout(tick, interval);
      applyLights(elements(), performance.now() / 1000);
    };

    const stop = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    function sync() {
      const hidden = document.hidden;
      for (const id of ['torch', 'lantern', 'candle'] as const) {
        const state = !hidden && flameOn(id) ? 'running' : 'paused';
        for (const element of elements()) element.style.setProperty(`--${id}-play`, state);
      }
      if (reduced.matches || hidden || !anyFlameOn()) {
        stop();
        if (reduced.matches) applyLights(elements(), STATIC_TIME);
        return;
      }
      if (timer) return;
      timer = window.setTimeout(tick, interval);
    }

    const resume = () => {
      applyLights(elements(), STATIC_TIME);
      stop();
      sync();
    };
    const changeRate = () => {
      interval = 1000 / flickerRate(narrow.matches, lowPower);
    };
    const remeasure = () => {
      watchFlames();
      sync();
    };

    watchFlames();
    applyLights(elements(), STATIC_TIME);
    sync();
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', resume);
    narrow.addEventListener('change', changeRate);
    window.addEventListener(LAYOUT_EVENT, remeasure);
    return () => {
      stop();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      narrow.removeEventListener('change', changeRate);
      window.removeEventListener(LAYOUT_EVENT, remeasure);
    };
  }, [targets, active, scene]);
}

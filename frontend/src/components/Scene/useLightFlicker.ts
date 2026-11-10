import { useEffect, type RefObject } from 'react';
import { LAYOUT_EVENT } from './lightLayout';
import {
  applyLights,
  flickerRate,
  glowReach,
  isLowPower,
  LIGHT_SOURCES,
  NARROW_QUERY,
  STATIC_TIME,
  type LightId,
} from './lighting';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const ALL_SOURCES: readonly LightId[] = LIGHT_SOURCES.map(source => source.id);

/**
 * Drives the fire. One timer for the whole scene, at the flicker rate, writes each source's intensity and radius as custom properties on the given elements.
 * It is a timer and not an animation frame loop on purpose: a frame callback keeps the page producing a frame at every refresh, 60 a second, to change the light 12 or 20 times a second. With a timer the page makes a frame only when the light has changed.
 * The loop runs only while a flame is on screen or near it: it stops when the tab is hidden and when every flame has scrolled out of view, and under reduced motion it never starts, so the sources are frozen at one moment instead.
 * The same states set `--<source>-play` on the elements, which the flame sprites read as their animation play state, so an unseen flame is not stepped either.
 * Only the flames of the sources that are drawn (`drawn`) are watched, and a flame whose element has left the page is forgotten. The margin around the viewport is the largest pool radius of the drawn sources, so a pool that reaches the screen is never frozen.
 * While the scene holds no `[data-light-source]` anchor at all, the timer runs as a fallback because there is nothing to measure. The fallback ends as soon as any anchor exists: with anchors present but none of them drawn, the loop stops.
 * The rate is lower on a narrow screen or a weak device.
 */
export function useLightFlicker(
  targets: readonly RefObject<HTMLElement | null>[],
  active: boolean,
  scene: HTMLElement | null = null,
  drawn: readonly LightId[] = ALL_SOURCES,
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
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (flames.has(entry.target)) flames.set(entry.target, entry.isIntersecting);
          }
          pruneFlames();
          sync();
        },
        { rootMargin: `${glowReach(drawn)}px` },
      );
    }

    function pruneFlames() {
      for (const element of [...flames.keys()]) {
        if (!element.isConnected) {
          flames.delete(element);
          observer?.unobserve(element);
        }
      }
    }

    const flameOn = (id: LightId) => {
      const anchors = [...flames].filter(([element]) => (element as HTMLElement).dataset.lightSource === id);
      return anchors.length === 0 || anchors.some(([, visible]) => visible);
    };
    // The fallback: while the scene has no flame anchor of any kind (nothing is drawn yet, or the hook runs without a scene), the loop cannot tell what is on screen and keeps running so the light is never frozen by a missing measurement.
    // Once the scene holds any anchor the fallback ends. Anchors that exist but belong to sources that are not drawn leave nothing to watch, so the loop stops instead of running for a light nobody can see, and the layout event that brings a drawn anchor starts it again.
    const sceneHasAnchors = () => !!scene?.querySelector('[data-light-source]');
    const anyFlameOn = () => {
      pruneFlames();
      if (flames.size === 0) return !sceneHasAnchors();
      return [...flames.values()].some(Boolean);
    };

    const watchFlames = () => {
      pruneFlames();
      for (const id of drawn) {
        scene?.querySelectorAll<HTMLElement>(`[data-light-source="${id}"]`).forEach(element => {
          if (flames.has(element)) return;
          // A new anchor counts as on screen until the observer reports it.
          flames.set(element, true);
          observer?.observe(element);
        });
      }
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
  }, [targets, active, scene, drawn]);
}

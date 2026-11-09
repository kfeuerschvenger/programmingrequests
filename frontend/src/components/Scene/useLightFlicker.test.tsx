import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { announceLayout } from './lightLayout';
import { FLICKER_HZ, LOW_FLICKER_HZ } from './lighting';
import { useLightFlicker } from './useLightFlicker';

type Listener = () => void;

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  constructor(private readonly callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe(element: Element) {
    this.observed.add(element);
  }
  unobserve(element: Element) {
    this.observed.delete(element);
  }
  disconnect() {
    this.observed.clear();
  }
  report(element: Element, isIntersecting: boolean) {
    this.callback([{ target: element, isIntersecting }]);
  }
}

describe('useLightFlicker', () => {
  let reduced = false;
  let narrow = false;
  let hidden = false;
  let element: HTMLDivElement;
  let targets: { current: HTMLElement | null }[];
  const listeners = { reduced: new Set<Listener>(), narrow: new Set<Listener>() };

  beforeEach(() => {
    vi.useFakeTimers();
    reduced = false;
    narrow = false;
    hidden = false;
    listeners.reduced.clear();
    listeners.narrow.clear();
    FakeIntersectionObserver.instances = [];
    element = document.createElement('div');
    targets = [{ current: element }];
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    window.matchMedia = ((query: string) => {
      const isNarrow = query.includes('max-width');
      const set = isNarrow ? listeners.narrow : listeners.reduced;
      return {
        get matches() {
          return isNarrow ? narrow : reduced;
        },
        media: query,
        addEventListener: (_: string, listener: Listener) => set.add(listener),
        removeEventListener: (_: string, listener: Listener) => set.delete(listener),
      };
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const torchIntensity = () => element.style.getPropertyValue('--torch-i');

  /** Counts the writes of the torch's intensity while the clock runs for the given time. */
  const writesIn = (milliseconds: number) => {
    let writes = 0;
    const setProperty = element.style.setProperty.bind(element.style);
    element.style.setProperty = (name: string, value: string | null) => {
      if (name === '--torch-i') writes += 1;
      setProperty(name, value);
    };
    vi.advanceTimersByTime(milliseconds);
    return writes;
  };

  it('runs one timer and rewrites the light on every update, never an animation frame loop', () => {
    const frame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', frame);
    renderHook(() => useLightFlicker(targets, true));
    expect(vi.getTimerCount()).toBe(1);

    const first = torchIntensity();
    expect(first).not.toBe('');
    const seen = new Set([first]);
    for (let step = 0; step < 10; step += 1) {
      vi.advanceTimersByTime(1000 / FLICKER_HZ + 1);
      seen.add(torchIntensity());
    }

    expect(seen.size).toBeGreaterThan(1);
    expect(vi.getTimerCount()).toBe(1);
    expect(frame).not.toHaveBeenCalled();
  });

  it('updates about twenty times a second', () => {
    renderHook(() => useLightFlicker(targets, true));

    const writes = writesIn(1000);

    expect(writes).toBeGreaterThanOrEqual(FLICKER_HZ - 2);
    expect(writes).toBeLessThanOrEqual(FLICKER_HZ + 2);
  });

  it('updates about twelve times a second on a narrow screen', () => {
    narrow = true;
    renderHook(() => useLightFlicker(targets, true));

    const writes = writesIn(1000);

    expect(writes).toBeGreaterThanOrEqual(LOW_FLICKER_HZ - 2);
    expect(writes).toBeLessThanOrEqual(LOW_FLICKER_HZ + 2);
  });

  it('updates about twelve times a second on a weak device', () => {
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(2);
    renderHook(() => useLightFlicker(targets, true));

    expect(writesIn(1000)).toBeLessThanOrEqual(LOW_FLICKER_HZ + 2);
  });

  it('changes its rate when the screen becomes narrow', () => {
    renderHook(() => useLightFlicker(targets, true));
    narrow = true;
    listeners.narrow.forEach(listener => listener());
    vi.advanceTimersByTime(100);

    expect(writesIn(1000)).toBeLessThanOrEqual(LOW_FLICKER_HZ + 2);
  });

  it('does not start a loop under reduced motion, and shows one still moment instead', () => {
    reduced = true;
    renderHook(() => useLightFlicker(targets, true));

    expect(vi.getTimerCount()).toBe(0);
    expect(torchIntensity()).not.toBe('');
    expect(element.style.getPropertyValue('--lantern-i')).not.toBe('');
  });

  it('starts and stops the loop when the reduced motion preference changes', () => {
    renderHook(() => useLightFlicker(targets, true));
    expect(vi.getTimerCount()).toBe(1);

    reduced = true;
    listeners.reduced.forEach(listener => listener());
    expect(vi.getTimerCount()).toBe(0);

    reduced = false;
    listeners.reduced.forEach(listener => listener());
    expect(vi.getTimerCount()).toBe(1);
  });

  it('pauses while the tab is hidden, pauses the flames, and resumes when it is shown again', () => {
    renderHook(() => useLightFlicker(targets, true));
    expect(element.style.getPropertyValue('--candle-play')).toBe('running');

    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(vi.getTimerCount()).toBe(0);
    expect(element.style.getPropertyValue('--candle-play')).toBe('paused');
    expect(writesIn(1000)).toBe(0);

    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(vi.getTimerCount()).toBe(1);
    expect(element.style.getPropertyValue('--candle-play')).toBe('running');
  });

  it('does not start when the tab is already hidden', () => {
    hidden = true;
    renderHook(() => useLightFlicker(targets, true));

    expect(vi.getTimerCount()).toBe(0);
  });

  it('does nothing by day', () => {
    renderHook(() => useLightFlicker(targets, false));

    expect(vi.getTimerCount()).toBe(0);
    expect(torchIntensity()).toBe('');
  });

  it('stops its timer, its observer and its listeners when it unmounts', () => {
    const { unmount } = renderHook(() => useLightFlicker(targets, true));
    expect(listeners.reduced.size).toBe(1);
    expect(listeners.narrow.size).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(listeners.reduced.size).toBe(0);
    expect(listeners.narrow.size).toBe(0);
  });

  describe('with flames that scroll out of view', () => {
    let scene: HTMLDivElement;
    let torch: HTMLSpanElement;
    let candle: HTMLSpanElement;

    beforeEach(() => {
      vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
      scene = document.createElement('div');
      torch = document.createElement('span');
      torch.dataset.lightSource = 'torch';
      candle = document.createElement('span');
      candle.dataset.lightSource = 'candle';
      scene.append(torch, candle);
      document.body.append(scene);
    });

    afterEach(() => {
      scene.remove();
    });

    const observer = () => FakeIntersectionObserver.instances[0] as FakeIntersectionObserver;

    it('observes every flame of the scene', () => {
      renderHook(() => useLightFlicker(targets, true, scene));

      expect([...observer().observed]).toEqual([torch, candle]);
    });

    it('stops the loop when every flame is out of view and starts it again when one comes back', () => {
      renderHook(() => useLightFlicker(targets, true, scene));
      expect(vi.getTimerCount()).toBe(1);

      act(() => {
        observer().report(torch, false);
        observer().report(candle, false);
      });
      expect(vi.getTimerCount()).toBe(0);
      expect(element.style.getPropertyValue('--torch-play')).toBe('paused');
      expect(element.style.getPropertyValue('--candle-play')).toBe('paused');

      act(() => observer().report(candle, true));
      expect(vi.getTimerCount()).toBe(1);
      expect(element.style.getPropertyValue('--candle-play')).toBe('running');
      expect(element.style.getPropertyValue('--torch-play')).toBe('paused');
    });

    it('keeps the loop while one flame is still in view', () => {
      renderHook(() => useLightFlicker(targets, true, scene));

      act(() => observer().report(torch, false));

      expect(vi.getTimerCount()).toBe(1);
    });

    it('picks up a flame that mounts later and forgets one that is gone', () => {
      renderHook(() => useLightFlicker(targets, true, scene));
      const lantern = document.createElement('span');
      lantern.dataset.lightSource = 'lantern';
      scene.append(lantern);
      torch.remove();

      act(() => announceLayout());

      expect(observer().observed.has(lantern)).toBe(true);
      expect(observer().observed.has(torch)).toBe(false);
    });
  });
});

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FLICKER_HZ } from './lighting';
import { useLightFlicker } from './useLightFlicker';

type FrameCallback = (time: number) => void;

describe('useLightFlicker', () => {
  let frames: FrameCallback[];
  let reduced = false;
  let hidden = false;
  let element: HTMLDivElement;
  let targets: { current: HTMLElement | null }[];
  let requestFrame: ReturnType<typeof vi.fn>;
  let cancelFrame: ReturnType<typeof vi.fn>;
  const motionListeners = new Set<() => void>();

  /** Runs the one pending animation frame at the given time, as the browser would. */
  const runFrame = (time: number) => {
    const callback = frames.pop();
    expect(callback).toBeDefined();
    callback?.(time);
  };

  beforeEach(() => {
    frames = [];
    reduced = false;
    hidden = false;
    motionListeners.clear();
    element = document.createElement('div');
    targets = [{ current: element }];
    requestFrame = vi.fn((callback: FrameCallback) => frames.push(callback));
    cancelFrame = vi.fn(() => {
      frames = [];
    });
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    window.matchMedia = ((query: string) => ({
      get matches() {
        return reduced;
      },
      media: query,
      addEventListener: (_: string, listener: () => void) => motionListeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => motionListeners.delete(listener),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const torchIntensity = () => element.style.getPropertyValue('--torch-i');

  it('runs one animation frame loop and rewrites the light on every update', () => {
    renderHook(() => useLightFlicker(targets, true));
    expect(requestFrame).toHaveBeenCalledTimes(1);

    const first = torchIntensity();
    expect(first).not.toBe('');
    runFrame(1000);
    const second = torchIntensity();
    runFrame(1000 + 1000 / FLICKER_HZ + 1);
    expect(requestFrame).toHaveBeenCalledTimes(3);
    expect(new Set([first, second, torchIntensity()]).size).toBeGreaterThan(1);
  });

  it('updates about twenty times a second, however often frames arrive', () => {
    renderHook(() => useLightFlicker(targets, true));
    let writes = 0;
    const setProperty = element.style.setProperty.bind(element.style);
    element.style.setProperty = (name: string, value: string | null) => {
      if (name === '--torch-i') writes += 1;
      setProperty(name, value);
    };

    for (let time = 1000; time < 2000; time += 1000 / 60) runFrame(time);

    expect(writes).toBeGreaterThanOrEqual(FLICKER_HZ - 2);
    expect(writes).toBeLessThanOrEqual(FLICKER_HZ + 2);
  });

  it('does not start a loop under reduced motion, and shows one still moment instead', () => {
    reduced = true;
    renderHook(() => useLightFlicker(targets, true));

    expect(requestFrame).not.toHaveBeenCalled();
    expect(torchIntensity()).not.toBe('');
    expect(element.style.getPropertyValue('--lantern-i')).not.toBe('');
  });

  it('starts and stops the loop when the reduced motion preference changes', () => {
    renderHook(() => useLightFlicker(targets, true));
    expect(requestFrame).toHaveBeenCalledTimes(1);

    reduced = true;
    motionListeners.forEach(listener => listener());
    expect(cancelFrame).toHaveBeenCalled();
    expect(frames).toHaveLength(0);

    reduced = false;
    motionListeners.forEach(listener => listener());
    expect(frames).toHaveLength(1);
  });

  it('pauses while the tab is hidden and resumes when it is shown again', () => {
    renderHook(() => useLightFlicker(targets, true));
    expect(frames).toHaveLength(1);

    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cancelFrame).toHaveBeenCalled();
    expect(frames).toHaveLength(0);

    const callsWhileHidden = requestFrame.mock.calls.length;
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(requestFrame.mock.calls.length).toBe(callsWhileHidden + 1);
    expect(frames).toHaveLength(1);
  });

  it('does not start when the tab is already hidden', () => {
    hidden = true;
    renderHook(() => useLightFlicker(targets, true));

    expect(requestFrame).not.toHaveBeenCalled();
  });

  it('does nothing by day', () => {
    renderHook(() => useLightFlicker(targets, false));

    expect(requestFrame).not.toHaveBeenCalled();
    expect(torchIntensity()).toBe('');
  });

  it('stops its loop and its listeners when it unmounts', () => {
    const { unmount } = renderHook(() => useLightFlicker(targets, true));
    expect(motionListeners.size).toBe(1);

    unmount();

    expect(cancelFrame).toHaveBeenCalled();
    expect(motionListeners.size).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { applyLights, LIGHT_SOURCES, lightAt, smoothNoise } from './lighting';

describe('smoothNoise', () => {
  it('stays between 0 and 1 and is continuous', () => {
    let previous = smoothNoise(0);
    for (let x = 0.01; x < 60; x += 0.01) {
      const value = smoothNoise(x);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(Math.abs(value - previous)).toBeLessThan(0.06);
      previous = value;
    }
  });
});

describe('lightAt', () => {
  it('never drops below the floor of its source or rises above 1, over a long time', () => {
    for (const source of LIGHT_SOURCES) {
      for (let t = 0; t < 600; t += 0.05) {
        const { intensity, radius } = lightAt(source, t);
        expect(intensity).toBeGreaterThanOrEqual(source.floor);
        expect(intensity).toBeLessThanOrEqual(1);
        expect(radius).toBeGreaterThan(0.9);
        expect(radius).toBeLessThan(1.1);
      }
    }
  });

  it('actually flickers, and each source on its own phase', () => {
    for (const source of LIGHT_SOURCES) {
      const values = new Set(Array.from({ length: 100 }, (_, i) => lightAt(source, i * 0.05).intensity.toFixed(2)));
      expect(values.size).toBeGreaterThan(10);
    }
    const [torch, lantern] = LIGHT_SOURCES;
    expect(torch && lantern && lightAt(torch, 5).intensity).not.toBeCloseTo(
      lantern ? lightAt(lantern, 5).intensity : 0,
      2,
    );
  });
});

describe('applyLights', () => {
  it('writes an intensity and a radius for every source on every target', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    applyLights([a, b], 1.5);

    for (const target of [a, b]) {
      for (const { id } of LIGHT_SOURCES) {
        expect(Number(target.style.getPropertyValue(`--${id}-i`))).toBeGreaterThan(0);
        expect(Number(target.style.getPropertyValue(`--${id}-r`))).toBeGreaterThan(0);
      }
    }
  });
});

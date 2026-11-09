import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { readCss } from '@/test/css';
import { Candle } from './Candle';
import { Scene } from './Scene';

const sceneCss = readCss('./Scene.module.css', import.meta.url);
const propsCss = readCss('./Props.module.css', import.meta.url);
const headerCss = readCss('../Header/Header.module.css', import.meta.url);

const originalMatchMedia = window.matchMedia.bind(window);

/** happy-dom has no layout: the width query that decides which sources are drawn is answered by hand. */
const setWide = (wide: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: wide && query.includes('min-width'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

/** The source of every light pool, in document order. */
const pools = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-light-pool]')].map(element => element.dataset.lightPool);

const renderScene = (scheme: 'light' | 'dark') =>
  render(
    <MantineProvider forceColorScheme={scheme}>
      <Scene footer={<footer>Credits</footer>}>
        <main>Board content</main>
      </Scene>
    </MantineProvider>,
  );

describe('Scene', () => {
  it('holds the page and the footer, and hides everything it draws from assistive technology', () => {
    const { container } = renderScene('light');

    expect(screen.getByRole('main')).toHaveTextContent('Board content');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Credits');
    for (const image of container.querySelectorAll('img')) {
      expect(image).toHaveAttribute('alt', '');
    }
    const outside = [...container.querySelectorAll('[aria-hidden="true"]')];
    expect(outside.length).toBeGreaterThan(3);
  });

  it('scatters scratches and ink on the planks', () => {
    const { container } = renderScene('light');

    expect(container.querySelectorAll('img[src*="scratches"]').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll('img[src*="ink-blot"]').length).toBeGreaterThanOrEqual(2);
  });

  it('is lit by the sun by day: no torch, no lantern, no flames', () => {
    const { container } = renderScene('light');

    expect(container.querySelector('img[src*="torch-unlit"]')).toBeNull();
    expect(container.querySelector('img[src*="lantern-unlit"]')).toBeNull();
    expect(container.querySelector('[data-light-source]')).toBeNull();
  });

  it('is lit by a torch and a lantern at night on a wide screen, each with its own flame and light pool', () => {
    setWide(true);
    const { container } = renderScene('dark');

    expect(container.querySelector('img[src*="torch-unlit"]')).not.toBeNull();
    expect(container.querySelector('img[src*="lantern-unlit"]')).not.toBeNull();
    const sources = [...container.querySelectorAll<HTMLElement>('[data-light-source]')].map(
      element => element.dataset.lightSource,
    );
    expect(sources).toEqual(['torch', 'lantern']);
    expect(pools(container)).toEqual(['torch', 'lantern', 'candle', 'torch', 'lantern', 'candle']);
  });

  it('draws one pool for the one source it shows on a narrow screen: the candle', () => {
    setWide(false);
    const { container } = renderScene('dark');

    expect(container.querySelector('img[src*="torch-unlit"]')).toBeNull();
    expect(container.querySelector('img[src*="lantern-unlit"]')).toBeNull();
    expect(container.querySelector('[data-light-source]')).toBeNull();
    // One pool on the wood and one over the paper, both for the candle.
    expect(pools(container)).toEqual(['candle', 'candle']);
  });

  it('puts the footer under the night layers, so it is lit like the board', () => {
    const { container } = renderScene('dark');

    const wall = container.querySelector('[data-testid="scene"]');
    expect(wall?.querySelector('footer')).not.toBeNull();
    expect(wall?.querySelector('[data-light-pool]')).not.toBeNull();
  });

  it('hangs the chains from the top of the page, over the frame', () => {
    expect(sceneCss).toMatch(/--wall-pad:/);
    // Each sign chain starts a frame and the gap above the board up from its sign, which is the top of the page.
    expect(headerCss).toMatch(/\.chain \{[^}]*top: calc\(\(var\(--frame\) \+ var\(--wall-pad\)\) \* -1\)/);
    expect(propsCss).toMatch(/\.lantern \{[^}]*top: calc\(var\(--wall-pad\) \* -1\)/);
  });
});

describe('Candle', () => {
  it('stands with an inkwell at night and is absent by day', () => {
    const night = render(
      <MantineProvider forceColorScheme="dark">
        <Candle />
      </MantineProvider>,
    );
    expect(night.container.querySelector('img[src*="candle-unlit"]')).not.toBeNull();
    expect(night.container.querySelector('img[src*="inkwell"]')).not.toBeNull();
    expect(night.container.querySelector('[data-light-source="candle"]')).not.toBeNull();
    night.unmount();

    const day = render(
      <MantineProvider forceColorScheme="light">
        <Candle />
      </MantineProvider>,
    );
    expect(day.container.querySelector('img')).toBeNull();
    expect(day.container.querySelector('[data-light-source]')).toBeNull();
  });
});

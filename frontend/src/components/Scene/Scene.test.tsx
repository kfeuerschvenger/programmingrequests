import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Candle } from './Candle';
import { Scene } from './Scene';

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

  it('is lit by a torch and a lantern at night, each with its own flame and light pool', () => {
    const { container } = renderScene('dark');

    expect(container.querySelector('img[src*="torch-unlit"]')).not.toBeNull();
    expect(container.querySelector('img[src*="lantern-unlit"]')).not.toBeNull();
    const sources = [...container.querySelectorAll<HTMLElement>('[data-light-source]')].map(
      element => element.dataset.lightSource,
    );
    expect(sources).toEqual(['torch', 'lantern']);
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

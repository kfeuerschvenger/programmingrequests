import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useIsDark } from './useIsDark';

const seen: boolean[] = [];

function Probe() {
  seen.push(useIsDark());
  return null;
}

describe('useIsDark', () => {
  afterEach(() => {
    seen.length = 0;
    document.documentElement.removeAttribute('data-mantine-color-scheme');
  });

  it('is dark on the very first render when the document already shows the dark scheme', () => {
    document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');

    render(
      <MantineProvider defaultColorScheme="auto">
        <Probe />
      </MantineProvider>,
    );

    expect(seen[0]).toBe(true);
  });

  it('is light on the first render when the document shows the light scheme, or none', () => {
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    const { unmount } = render(
      <MantineProvider defaultColorScheme="auto">
        <Probe />
      </MantineProvider>,
    );
    expect(seen[0]).toBe(false);
    unmount();

    seen.length = 0;
    document.documentElement.removeAttribute('data-mantine-color-scheme');
    render(
      <MantineProvider defaultColorScheme="auto">
        <Probe />
      </MantineProvider>,
    );
    expect(seen[0]).toBe(false);
  });

  it('follows the scheme Mantine forces afterwards', () => {
    render(
      <MantineProvider forceColorScheme="dark">
        <Probe />
      </MantineProvider>,
    );

    expect(seen.at(-1)).toBe(true);
  });
});

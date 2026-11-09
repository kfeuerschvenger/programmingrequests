import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VotingRules } from '@/components/Header/components/VotingSystemInfo/VotingRules';
import { Candle } from './Candle';
import { LAYOUT_EVENT } from './lightLayout';

describe('layout events', () => {
  const heard = vi.fn();

  afterEach(() => {
    window.removeEventListener(LAYOUT_EVENT, heard);
    heard.mockClear();
  });

  it('are announced when the voting rules open, so their sheet is given a shadow', () => {
    window.addEventListener(LAYOUT_EVENT, heard);

    render(
      <MantineProvider>
        <VotingRules />
      </MantineProvider>,
    );

    expect(heard).toHaveBeenCalled();
  });

  it('are announced when the candle is mounted at night, and not by day', () => {
    window.addEventListener(LAYOUT_EVENT, heard);

    const day = render(
      <MantineProvider forceColorScheme="light">
        <Candle />
      </MantineProvider>,
    );
    expect(heard).not.toHaveBeenCalled();
    day.unmount();

    render(
      <MantineProvider forceColorScheme="dark">
        <Candle />
      </MantineProvider>,
    );
    expect(heard).toHaveBeenCalled();
  });
});

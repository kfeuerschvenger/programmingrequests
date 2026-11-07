import { useComputedColorScheme } from '@mantine/core';

/** True while the board is lit by fire rather than by the sun. */
export function useIsDark(): boolean {
  return useComputedColorScheme('light', { getInitialValueInEffect: true }) === 'dark';
}

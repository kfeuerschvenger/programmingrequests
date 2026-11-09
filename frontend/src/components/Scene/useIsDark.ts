import { useState } from 'react';
import { useComputedColorScheme } from '@mantine/core';

type Scheme = 'light' | 'dark';

/** The scheme `public/color-scheme.js` put on the document before the first paint, if it ran. */
const schemeOnDocument = (): Scheme | undefined => {
  const value = document.documentElement.getAttribute('data-mantine-color-scheme');
  return value === 'dark' || value === 'light' ? value : undefined;
};

/**
 * The colour scheme in use. The first render takes the scheme the document already shows, so a dark user never gets one light render first; Mantine's own value, which is read in an effect, takes over from there and drives every change.
 */
export function useColorSchemeValue(): Scheme {
  const [initial] = useState(schemeOnDocument);
  return useComputedColorScheme(initial ?? 'light', { getInitialValueInEffect: true });
}

/** True while the board is lit by fire rather than by the sun. */
export function useIsDark(): boolean {
  return useColorSchemeValue() === 'dark';
}

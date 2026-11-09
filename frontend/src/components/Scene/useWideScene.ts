import { useSyncExternalStore } from 'react';

/** The width from which the gutters have room for the torch and the lantern. Narrower than this, only the candle is drawn. */
export const WIDE_SCENE_QUERY = '(min-width: 1100px)';

const subscribe = (notify: () => void) => {
  const query = window.matchMedia(WIDE_SCENE_QUERY);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

const read = () => window.matchMedia(WIDE_SCENE_QUERY).matches;

/** True while the screen is wide enough for the torch and the lantern. The server snapshot is the narrow one. */
export function useWideScene(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

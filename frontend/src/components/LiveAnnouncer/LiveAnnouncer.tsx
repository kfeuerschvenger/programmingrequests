import { useSyncExternalStore } from 'react';
import { VisuallyHidden } from '@mantine/core';
import { getAnnouncement, subscribeToAnnouncements } from '@/lib/announcer';

/**
 * The one polite live region of the board. A vote result is spoken here, naming the quest, instead of by a region on every card: with a hundred cards, a hundred regions would each need to be watched by assistive technology and none of them could say which quest scored.
 */
export function LiveAnnouncer() {
  const { text, nonce } = useSyncExternalStore(subscribeToAnnouncements, getAnnouncement, getAnnouncement);

  return (
    <VisuallyHidden role="status" aria-live="polite" aria-atomic="true" data-testid="announcer">
      <span key={nonce}>{text}</span>
    </VisuallyHidden>
  );
}

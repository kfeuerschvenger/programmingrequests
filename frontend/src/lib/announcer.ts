/** What the shared live region says now. A new nonce makes an identical sentence read out again. */
export interface Announcement {
  text: string;
  nonce: number;
}

const EMPTY: Announcement = { text: '', nonce: 0 };

let current = EMPTY;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

/** Says `text` through the one polite live region of the page. */
export const announce = (text: string) => {
  current = { text, nonce: current.nonce + 1 };
  emit();
};

/** Empties the live region. */
export const clearAnnouncement = () => {
  current = EMPTY;
  emit();
};

export const subscribeToAnnouncements = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getAnnouncement = () => current;

const FIRST_WORDS = 6;

/** The opening words of a quest, enough to tell it apart from the others without reading it all out. */
export const firstWords = (text: string, count = FIRST_WORDS) => text.trim().split(/\s+/).slice(0, count).join(' ');

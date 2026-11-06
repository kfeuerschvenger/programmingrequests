/** The score as it is written on the seal: a true minus sign, so a negative score reads as one. */
export const sealText = (value: number) => (value < 0 ? `−${Math.abs(value)}` : String(value));

/** Longer scores get a smaller digit size so they stay inside the wax. */
export const sealSize = (text: string) => (text.length <= 2 ? 'md' : text.length === 3 ? 'sm' : 'xs');

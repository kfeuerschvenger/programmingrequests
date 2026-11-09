import { useState } from 'react';
import { VisuallyHidden } from '@mantine/core';
import classes from './WaxSeal.module.css';
import { sealSize, sealText } from './sealText';

interface WaxSealProps {
  /** The score the seal shows. */
  value: number;
  /** Test hook for the seal. */
  testId?: string;
}

/**
 * The score of a quest, pressed in wax. When the score changes the seal is stamped again, a short press that reduced motion turns into an instant swap.
 * The wrapper is static text, "Score: N" to a screen reader. It is not a live region: one on every card would announce a bare number with no quest named, so the result of a vote is spoken by the shared `LiveAnnouncer` instead.
 */
export function WaxSeal({ value, testId }: WaxSealProps) {
  // The seal is stamped again only when the score changes after the first render, never on the first one.
  const [shown, setShown] = useState(value);
  const [stamps, setStamps] = useState(0);
  if (shown !== value) {
    setShown(value);
    setStamps(count => count + 1);
  }

  const text = sealText(value);

  return (
    <div data-testid={testId} className={classes.root}>
      <VisuallyHidden>Score: </VisuallyHidden>
      <span key={stamps} className={classes.seal} data-size={sealSize(text)} data-stamped={stamps > 0 || undefined}>
        <span className={classes.disc} aria-hidden="true" />
        <span className={classes.digits}>{text}</span>
      </span>
    </div>
  );
}

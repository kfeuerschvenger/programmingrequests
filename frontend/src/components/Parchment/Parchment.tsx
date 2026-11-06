import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import classes from './Parchment.module.css';

import { scramble, tearFor, tiltFor, type ParchmentKind } from './tears';

interface ParchmentProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** `card` is the small pinned notice, `sheet` the wide page used by the form and the modal. */
  kind?: ParchmentKind;
  /** Picks the torn outline, the stains, the lean and the pin position, the same ones every time for the same seed. */
  seed?: number;
  /** Renders a brass pin at the top edge. */
  pinned?: boolean;
  /** Straightens and lifts the sheet under the pointer. */
  lifts?: boolean;
  /** Leans the sheet by up to a degree and a half either way. Off, the sheet hangs straight. */
  leans?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
  children: ReactNode;
}

/** An irregular, burnt-edged parchment: the outline and the wear are SVG masks and overlays, the content on top stays plain HTML. */
export function Parchment({
  kind = 'card',
  seed = 0,
  pinned = false,
  lifts = false,
  leans = true,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}: ParchmentProps) {
  const hash = scramble(seed + 31);
  const vars = {
    '--tilt': `${leans ? tiltFor(seed).toFixed(2) : 0}deg`,
    '--tx': `${hash % 320}px`,
    '--ty': `${(hash >>> 9) % 320}px`,
    '--pin-x': `${48 + ((hash >>> 5) % 9)}%`,
    ...style,
  } as CSSProperties;

  return (
    <Tag
      {...rest}
      className={[classes.root, className].filter(Boolean).join(' ')}
      style={vars}
      data-kind={kind}
      data-tear={tearFor(seed, kind)}
      data-lifts={lifts || undefined}
    >
      <div className={classes.sheet}>{children}</div>
      {pinned && <span className={classes.pin} aria-hidden="true" />}
    </Tag>
  );
}

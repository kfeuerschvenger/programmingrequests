import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import classes from './Parchment.module.css';

import { art, type SceneImage } from '@/components/Scene/assets';
import { fastenerFor, fastenerXFor, tiltFor, type FastenerKind, type ParchmentKind } from './fasteners';

const FASTENER_ART: Record<FastenerKind, SceneImage> = {
  'nail-flush': art.nailFlush,
  'nail-half': art.nailHalf,
  'nail-angled': art.nailAngled,
  'nail-bent': art.nailBent,
  'pin-brass': art.pinBrass,
  'dagger-stuck': art.dagger,
};

export interface Fastener {
  kind: FastenerKind;
  /** Percentage of the width, from the left. The dagger ignores it and takes the top right corner. */
  x?: number;
}

interface ParchmentProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** `card` is the tall quest paper, `sheet` the wide page used by the form and the modal. */
  kind?: ParchmentKind;
  /** Picks the lean and the fastener, the same ones every time for the same seed. */
  seed?: number;
  /** Fastens the paper with the one the seed picks. */
  pinned?: boolean;
  /** Fastens the paper with exactly these, in place of the seeded one. */
  fasteners?: readonly Fastener[];
  /** Straightens and lifts the sheet under the pointer. */
  lifts?: boolean;
  /** Leans the sheet by up to a degree and a half either way. Off, the sheet hangs straight. */
  leans?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
  children: ReactNode;
}

/**
 * A weathered parchment. The paper is a nine-slice image drawn as the element's border, so the torn edge keeps its shape at any height while the middle stretches. Text stays plain HTML on top.
 * The fastener is an image over the top edge. The shadow it casts follows `--cq-shadow-x` and `--cq-shadow-y`, which the lighting sets per element at night.
 */
export function Parchment({
  kind = 'card',
  seed = 0,
  pinned = false,
  fasteners,
  lifts = false,
  leans = true,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}: ParchmentProps) {
  const vars = { '--tilt': `${leans ? tiltFor(seed).toFixed(2) : 0}deg`, ...style } as CSSProperties;
  const holding: readonly Fastener[] =
    fasteners ?? (pinned ? [{ kind: fastenerFor(seed), x: fastenerXFor(seed) }] : []);

  return (
    <Tag
      {...rest}
      className={[classes.root, className].filter(Boolean).join(' ')}
      style={vars}
      data-kind={kind}
      data-cast=""
      data-lifts={lifts || undefined}
    >
      <div className={classes.sheet}>{children}</div>
      {holding.map(({ kind: fastener, x }, index) => {
        const image = FASTENER_ART[fastener];
        return (
          <img
            key={`${fastener}-${index}`}
            className={classes.fastener}
            data-fastener={fastener}
            style={x === undefined ? undefined : ({ '--x': `${x}%` } as CSSProperties)}
            src={image.src}
            srcSet={image.srcSet}
            width={image.width}
            height={image.height}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        );
      })}
    </Tag>
  );
}

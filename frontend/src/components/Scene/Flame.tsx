import classes from './Flame.module.css';
import type { LightId } from './lighting';

interface FlameProps {
  /** Which fire this is. It sets the size. */
  source: LightId;
  className?: string;
}

/**
 * An invisible marker the size of a flame, placed on a prop where the fire burns. The lights measure it to know where to centre the pool and the sprite, so the fire follows the prop at every width.
 */
export function FlameAnchor({ source, className }: FlameProps) {
  return (
    <span
      aria-hidden="true"
      data-light-source={source}
      className={[classes.anchor, classes[source], className].filter(Boolean).join(' ')}
    />
  );
}

/**
 * An eight frame flame, played by stepping a sprite strip. The strip is drawn for the `screen` blend, so its black becomes transparent over any background.
 * It is drawn in the lights layer, never inside a prop: a prop that is its own stacking context would blend the flame with itself instead of with the board.
 */
export function FlameSprite({ source, className }: FlameProps) {
  return <span aria-hidden="true" className={[classes.sprite, classes[source], className].filter(Boolean).join(' ')} />;
}

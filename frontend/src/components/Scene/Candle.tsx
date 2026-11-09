import { useLayoutEffect } from 'react';
import { art } from './assets';
import classes from './Candle.module.css';
import { FlameAnchor } from './Flame';
import { announceLayout } from './lightLayout';
import { useIsDark } from './useIsDark';

/** A candle and an inkwell on a little ledge above the sort control. It is lit at night and absent by day. */
export function Candle() {
  const dark = useIsDark();
  // The candle's pool is placed on its flame, which exists only from this render on.
  useLayoutEffect(() => {
    if (dark) announceLayout();
  }, [dark]);
  if (!dark) return null;

  return (
    <div className={classes.stand} aria-hidden="true">
      <span className={classes.ledge} />
      <img
        className={classes.inkwell}
        src={art.inkwell.src}
        srcSet={art.inkwell.srcSet}
        width={art.inkwell.width}
        height={art.inkwell.height}
        alt=""
      />
      <div className={classes.candle}>
        <FlameAnchor source="candle" className={classes.flame} />
        <img
          src={art.candle.src}
          srcSet={art.candle.srcSet}
          width={art.candle.width}
          height={art.candle.height}
          alt=""
        />
      </div>
    </div>
  );
}

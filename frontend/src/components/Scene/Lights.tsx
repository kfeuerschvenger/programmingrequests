import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { FlameSprite } from './Flame';
import classes from './Lights.module.css';
import { castShadows, LAYOUT_EVENT, placePools } from './lightLayout';
import { LIGHT_SOURCES } from './lighting';
import { useLightFlicker } from './useLightFlicker';

interface LightsProps {
  board: HTMLElement | null;
  /** Night: three fire pools that flicker. Day: sunlight from the top left. */
  dark: boolean;
}

/**
 * Two overlay layers on the board. `under` sits below the content and lights the bare wood, `over` sits above it and tints everything, the parchment included.
 * Neither takes pointer events or enters the accessibility tree. The flicker writes custom properties on these two elements only, so no style recalculation reaches the cards.
 */
export function Lights({ board, dark }: LightsProps) {
  const under = useRef<HTMLDivElement>(null);
  const over = useRef<HTMLDivElement>(null);
  const targets = useMemo(() => [under, over], []);

  useLightFlicker(targets, dark);

  useLayoutEffect(() => {
    const element = board;
    if (!element) return;
    let pending = 0;
    const run = () => {
      pending = 0;
      const layers = [under.current, over.current].filter((layer): layer is HTMLDivElement => !!layer);
      placePools(element, layers);
      castShadows(element, dark);
    };
    // Coalesces bursts of layout events into one measurement. A timer rather than an animation frame, so the flicker stays the only frame loop on the page.
    const schedule = () => {
      if (!pending) pending = window.setTimeout(run, 0);
    };
    run();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    window.addEventListener(LAYOUT_EVENT, schedule);
    return () => {
      window.clearTimeout(pending);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('load', schedule);
      window.removeEventListener(LAYOUT_EVENT, schedule);
    };
  }, [board, dark]);

  // Web fonts change the height of the header and the form, which moves every source.
  useEffect(() => {
    void document.fonts?.ready?.then(() => window.dispatchEvent(new Event(LAYOUT_EVENT)));
  }, []);

  return (
    <>
      <div ref={under} className={classes.under} aria-hidden="true">
        {dark && (
          <>
            <span className={classes.nightWood} />
            {LIGHT_SOURCES.map(source => (
              <span key={source.id} className={`${classes.pool} ${classes.glow} ${classes[source.id]}`} />
            ))}
          </>
        )}
      </div>
      <div ref={over} className={classes.over} aria-hidden="true">
        {dark ? (
          <>
            <span className={classes.nightPaper} />
            {LIGHT_SOURCES.map(source => (
              <span key={source.id} className={`${classes.pool} ${classes.soft} ${classes[source.id]}`} />
            ))}
            {LIGHT_SOURCES.map(source => (
              <FlameSprite key={source.id} source={source.id} className={`${classes.slot} ${classes[source.id]}`} />
            ))}
          </>
        ) : (
          <>
            <span className={classes.sun} />
            <span className={classes.shaft} />
            <span className={classes.shade} />
          </>
        )}
      </div>
    </>
  );
}

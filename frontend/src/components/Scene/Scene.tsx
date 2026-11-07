import { useState, type ReactNode } from 'react';
import { art } from './assets';
import { Lights } from './Lights';
import { Props } from './Props';
import classes from './Scene.module.css';
import { useIsDark } from './useIsDark';

interface SceneProps {
  /** The page: header and main. They sit on the board. */
  children: ReactNode;
  /** The footer hangs below the board, on the wall. */
  footer: ReactNode;
}

/** Marks scattered on the planks. Their positions are fixed per breakpoint in the stylesheet and sit in the margins, the header or below the last quest, never under text. */
const MARKS = [
  { name: 'scratchA', image: art.scratches1 },
  { name: 'scratchB', image: art.scratches2 },
  { name: 'scratchC', image: art.scratches1 },
  { name: 'blotA', image: art.inkBlot1 },
  { name: 'blotB', image: art.inkBlot2 },
  { name: 'blotC', image: art.inkBlot3 },
] as const;

/**
 * The room: a wall in shadow, a wooden board in an iron-cornered frame, and the light that falls on it.
 * Everything here is decoration, hidden from the accessibility tree. The page content is stacked above the planks and below the light.
 */
export function Scene({ children, footer }: SceneProps) {
  // A state, not a ref object: the lights measure the board, and a layout effect in a child runs before the parent's ref is attached.
  const [board, setBoard] = useState<HTMLDivElement | null>(null);
  const dark = useIsDark();

  return (
    <div className={classes.wall} data-testid="scene">
      <div ref={setBoard} className={classes.board}>
        <div className={classes.frame} aria-hidden="true">
          <span className={`${classes.beamSide} ${classes.left}`}>
            <span className={classes.beamStrip} />
          </span>
          <span className={`${classes.beamSide} ${classes.right}`}>
            <span className={classes.beamStrip} />
          </span>
          <span className={`${classes.beam} ${classes.top}`} />
          <span className={`${classes.beam} ${classes.bottom}`} />
          <span className={`${classes.corner} ${classes.cornerTl}`} />
          <span className={`${classes.corner} ${classes.cornerTr}`} />
          <span className={`${classes.corner} ${classes.cornerBr}`} />
          <span className={`${classes.corner} ${classes.cornerBl}`} />
          <span className={classes.rim} />
        </div>
        <div className={classes.marks} aria-hidden="true">
          {MARKS.map(({ name, image }) => (
            <img
              key={name}
              className={`${classes.mark} ${classes[name]}`}
              src={image.src}
              srcSet={image.srcSet}
              width={image.width}
              height={image.height}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
        {dark && <Props />}
        <div className={classes.content}>{children}</div>
        <Lights board={board} dark={dark} />
      </div>
      {footer}
    </div>
  );
}

import { art } from './assets';
import { FlameAnchor } from './Flame';
import classes from './Props.module.css';

/** The torch on the left frame and the lantern hanging on the right, lit only at night. The candle stands further down the page, next to the sort control. */
export function Props() {
  return (
    <div className={classes.props} aria-hidden="true">
      <div className={classes.torch}>
        <FlameAnchor source="torch" className={classes.torchFlame} />
        <img src={art.torch.src} srcSet={art.torch.srcSet} width={art.torch.width} height={art.torch.height} alt="" />
      </div>
      <div className={classes.lantern}>
        <span className={classes.lanternChain} />
        <div className={classes.lanternBody}>
          <FlameAnchor source="lantern" className={classes.lanternFlame} />
          <img
            src={art.lantern.src}
            srcSet={art.lantern.srcSet}
            width={art.lantern.width}
            height={art.lantern.height}
            alt=""
          />
        </div>
      </div>
    </div>
  );
}

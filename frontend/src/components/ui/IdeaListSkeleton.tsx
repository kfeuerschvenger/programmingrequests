import { Parchment } from '@/components/Parchment/Parchment';
import classes from './States.module.css';

interface IdeaListSkeletonProps {
  count?: number;
}

/** Blank notices with shimmering lines where the text will be, shaped like the cards that replace them. */
export function IdeaListSkeleton({ count = 3 }: IdeaListSkeletonProps) {
  return (
    <ul
      aria-busy="true"
      aria-label="Unrolling the scrolls"
      role="status"
      data-testid="idea-list-skeleton"
      className={classes.skeletonGrid}
    >
      {Array.from({ length: count }, (_, index) => (
        <Parchment key={index} as="li" seed={index + 11} pinned className={classes.skeletonCard}>
          <span className={classes.bar} />
          <span className={classes.bar} />
          <span className={`${classes.bar} ${classes.barShort}`} />
          <span className={`${classes.bar} ${classes.barByline}`} />
          <span className={`${classes.bar} ${classes.barVote}`} />
        </Parchment>
      ))}
    </ul>
  );
}

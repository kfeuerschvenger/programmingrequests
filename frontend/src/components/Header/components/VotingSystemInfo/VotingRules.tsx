import { modals } from '@mantine/modals';
import { Button } from '@mantine/core';
import { Parchment } from '@/components/Parchment/Parchment';
import classes from './ShowInfo.module.css';

export const VOTING_RULES_TITLE = 'Voting rules';

/** The rules of the board, written on a sheet of parchment. */
export function VotingRules() {
  return (
    <Parchment kind="sheet" seed={0} pinned leans={false}>
      <div className={classes.rules}>
        <p className={classes.title} aria-hidden="true">
          {VOTING_RULES_TITLE}
        </p>
        <p className={classes.text}>
          In this realm of choices, you wield the power of a single vote per quest, for or against. Back a quest to lift
          it up the board, or reject it to sink it, and the wax seal keeps the score.
        </p>
        <p className={classes.text}>
          Should doubt cloud your mind, fear not: press the same button again to withdraw your vote, or the opposite one
          to change your will.
        </p>
        <div className={classes.actions}>
          <Button onClick={() => modals.closeAll()}>I accept my destiny</Button>
        </div>
      </div>
    </Parchment>
  );
}

import classes from './IdeaItem.module.css';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { IconShieldCheck, IconShieldX } from '@tabler/icons-react';
import { useIsMutating } from '@tanstack/react-query';

import { Parchment } from '@/components/Parchment/Parchment';
import { WaxSeal } from '@/components/WaxSeal/WaxSeal';
import { useVote, voteMutationKey } from '@/hooks/useVote';
import type { Idea, VoteValue } from '@/types/ideas';

dayjs.extend(relativeTime);

interface IdeaItemProps {
  idea: Idea;
}

export const ANONYMOUS = 'Anonymous adventurer';

const IdeaItem = ({ idea }: IdeaItemProps) => {
  const { mutate } = useVote(idea.id);
  // Read from the mutation cache rather than from this instance, so a remount in the middle of a vote keeps the buttons disabled.
  const isPending = useIsMutating({ mutationKey: voteMutationKey(idea.id) }) > 0;

  // Pressing the button that is already active withdraws the vote; the other one switches it.
  // While a vote on this quest is in flight the buttons are aria-disabled and dimmed, and clicks are ignored.
  const handleVote = (value: VoteValue) => {
    if (isPending) return;
    mutate({ idea, value });
  };

  const author = idea.author ?? ANONYMOUS;

  return (
    <Parchment as="li" seed={idea.id} pinned lifts className={classes.item}>
      <p className={classes.body}>{idea.description}</p>
      <div className={classes.rule} aria-hidden="true" />
      <p className={classes.byline}>
        <span className={classes.author}>{author}</span>
        <time className={classes.time} dateTime={idea.createdAt}>
          {dayjs(idea.createdAt).fromNow()}
        </time>
      </p>
      <div className={classes.vote}>
        <button
          type="button"
          className={classes.button}
          data-kind="back"
          data-pending={isPending || undefined}
          aria-label="Back this quest"
          aria-pressed={idea.myVote === 1}
          aria-disabled={isPending}
          onClick={() => handleVote(1)}
        >
          <IconShieldCheck size={20} stroke={2} aria-hidden="true" />
          Back
        </button>
        <WaxSeal value={idea.score} testId="score" />
        <button
          type="button"
          className={classes.button}
          data-kind="reject"
          data-pending={isPending || undefined}
          aria-label="Reject this quest"
          aria-pressed={idea.myVote === -1}
          aria-disabled={isPending}
          onClick={() => handleVote(-1)}
        >
          <IconShieldX size={20} stroke={2} aria-hidden="true" />
          Reject
        </button>
      </div>
    </Parchment>
  );
};

export default IdeaItem;

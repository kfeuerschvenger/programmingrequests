import classes from './IdeaItem.module.css';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { ActionIcon, Avatar, Grid, Group, Paper, Text, VisuallyHidden } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import { useVote } from '@/hooks/useVote';
import type { Idea, VoteValue } from '@/types/ideas';

dayjs.extend(relativeTime);

interface IdeaItemProps {
  idea: Idea;
}

const ANONYMOUS = 'Anonymous';

const IdeaItem = ({ idea }: IdeaItemProps) => {
  const { mutate, isPending } = useVote(idea.id);

  // Pressing the arrow that is already active withdraws the vote; the other arrow switches it.
  // While a vote on this idea is in flight the arrows are aria-disabled and dimmed, and clicks are ignored.
  const handleVote = (value: VoteValue) => {
    if (isPending) return;
    mutate({ idea, value });
  };

  const pendingStyle = { outline: 'none', opacity: isPending ? 0.5 : 1 };

  const author = idea.author ?? ANONYMOUS;

  return (
    <Paper withBorder radius="md" className={classes.comment}>
      <Grid>
        <Grid.Col span={11}>
          <Group>
            <Avatar name={author} color="initials" />
            <div>
              <Text fz="sm">{author}</Text>
              <Text fz="xs" c="dimmed">
                {dayjs(idea.createdAt).fromNow()}
              </Text>
            </div>
          </Group>
          <Text className={classes.body} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {idea.description}
          </Text>
        </Grid.Col>
        <Grid.Col span={1}>
          <ActionIcon.Group orientation="vertical">
            <ActionIcon
              variant={idea.myVote === 1 ? 'light' : 'transparent'}
              color="teal"
              size="md"
              radius="md"
              aria-label="Vote up"
              aria-pressed={idea.myVote === 1}
              aria-disabled={isPending}
              onClick={() => handleVote(1)}
              style={pendingStyle}
            >
              <IconChevronUp color="var(--mantine-color-teal-text)" />
            </ActionIcon>
            <ActionIcon
              component="div"
              variant="transparent"
              color="dark.4"
              size="md"
              radius="md"
              role="status"
              aria-live="polite"
              data-testid="score"
            >
              <VisuallyHidden>Score: </VisuallyHidden>
              <Text fw={700} c="var(--mantine-color-text)">
                {idea.score}
              </Text>
            </ActionIcon>
            <ActionIcon
              variant={idea.myVote === -1 ? 'light' : 'transparent'}
              color="red"
              size="md"
              radius="md"
              aria-label="Vote down"
              aria-pressed={idea.myVote === -1}
              aria-disabled={isPending}
              onClick={() => handleVote(-1)}
              style={pendingStyle}
            >
              <IconChevronDown color="var(--mantine-color-red-text)" />
            </ActionIcon>
          </ActionIcon.Group>
        </Grid.Col>
      </Grid>
    </Paper>
  );
};

export default IdeaItem;

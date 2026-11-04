import classes from './IdeaItem.module.css';

import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useApi } from '@/hooks';
import { Idea, VoteArgs, VoteValue } from '@/models';
import { voteIdea, withdrawVote } from '@/services';

import { ActionIcon, Avatar, Grid, Group, Paper, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

dayjs.extend(relativeTime);

interface IdeaItemProps {
  idea: Idea;
}

const ANONYMOUS = 'Anonymous';

const IdeaItem = ({ idea }: IdeaItemProps) => {
  const [current, setCurrent] = useState<Idea>(idea);
  const { loading: voting, fetch: castVote } = useApi<Idea, VoteArgs>(voteIdea);
  const { loading: withdrawing, fetch: withdraw } = useApi<Idea, number>(withdrawVote);

  useEffect(() => {
    setCurrent(idea);
  }, [idea]);

  const handleVote = async (value: VoteValue) => {
    if (voting || withdrawing) return;

    // Pressing the arrow that is already active withdraws the vote; the other arrow switches it.
    const { data, error } =
      current.myVote === value ? await withdraw(current.id) : await castVote({ ideaId: current.id, value });

    if (data) {
      setCurrent(data);
      notifications.show({
        color: 'teal',
        title: data.myVote === 0 ? 'Vote withdrawn' : 'Vote submitted!',
        message: data.myVote === 0 ? 'Your vote on this idea is gone.' : 'Thank you for your feedback on this idea!',
      });
    } else if (error) {
      notifications.show({
        color: 'red',
        title: 'Voting not allowed',
        message: error.message,
      });
    }
  };

  const author = current.author ?? ANONYMOUS;

  return (
    <Paper withBorder radius="md" className={classes.comment}>
      <Grid>
        <Grid.Col span={11}>
          <Group>
            <Avatar name={author} color="initials" />
            <div>
              <Text fz="sm">{author}</Text>
              <Text fz="xs" c="dimmed">
                {dayjs(current.createdAt).fromNow()}
              </Text>
            </div>
          </Group>
          <Text className={classes.body} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {current.description}
          </Text>
        </Grid.Col>
        <Grid.Col span={1}>
          <ActionIcon.Group orientation="vertical">
            <ActionIcon
              variant={current.myVote === 1 ? 'light' : 'transparent'}
              color="teal"
              size="md"
              radius="md"
              aria-label="Vote up"
              onClick={() => handleVote(1)}
              style={{ outline: 'none' }}
            >
              <IconChevronUp color="var(--mantine-color-teal-text)" />
            </ActionIcon>
            <ActionIcon darkHidden variant="transparent" color="dark.4" size="md" radius="md">
              <Text fw={700}>{current.score}</Text>
            </ActionIcon>
            <ActionIcon lightHidden variant="transparent" color="white" size="md" radius="md">
              <Text fw={700}>{current.score}</Text>
            </ActionIcon>
            <ActionIcon
              variant={current.myVote === -1 ? 'light' : 'transparent'}
              color="red"
              size="md"
              radius="md"
              aria-label="Vote down"
              onClick={() => handleVote(-1)}
              style={{ outline: 'none' }}
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

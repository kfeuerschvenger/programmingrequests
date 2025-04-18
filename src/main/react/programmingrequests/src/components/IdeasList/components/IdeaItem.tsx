import classes from './IdeaItem.module.css';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useApi } from '@/hooks';
import { Request, UseApiStatusResponse, Vote } from '@/models';
import { voteIdea } from '@/services';

import { ActionIcon, Avatar, Grid, Group, Paper, Text, TypographyStylesProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCounter } from '@mantine/hooks';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

dayjs.extend(relativeTime);

interface IdeaItemProps {
  idea: Request;
  ipAddress: string;
}

const IdeaItem = ({ idea, ipAddress }: IdeaItemProps) => {
  const [votes, { increment, decrement }] = useCounter(idea.upVotes);
  const { loading, fetch } = useApi<UseApiStatusResponse, Vote>(voteIdea);

  const handleVote = async (value: number) => {
    if (loading) return;
    const { data } = await fetch({ requestId: idea.id, ipAddress, value });

    if (data?.status === 'OK') {
      value === 1 ? increment() : decrement();
      notifications.show({
        color: 'teal',
        title: 'Vote submitted!',
        message: 'Thank you for your feedback on this idea!',
      });
    }
    if (data?.status === 'ERROR') {
      notifications.show({
        color: 'red',
        title: data.title,
        message: data.message,
      });
    }
  };

  return (
    <Paper withBorder radius="md" className={classes.comment}>
      <Grid>
        <Grid.Col span={11}>
          <Group>
            <Avatar name={idea.author} color="initials" />
            <div>
              <Text fz="sm">{idea.author}</Text>
              <Text fz="xs" c="dimmed">
                {dayjs(idea.date).fromNow()}
              </Text>
            </div>
          </Group>
          <TypographyStylesProvider className={classes.body}>
            <div
              className={classes.content}
              dangerouslySetInnerHTML={{
                __html: idea.description,
              }}
            />
          </TypographyStylesProvider>
        </Grid.Col>
        <Grid.Col span={1}>
          <ActionIcon.Group orientation="vertical">
            <ActionIcon
              variant="transparent"
              size="md"
              radius="md"
              onClick={() => handleVote(1)}
              style={{ outline: 'none' }}
            >
              <IconChevronUp color="var(--mantine-color-teal-text)" />
            </ActionIcon>
            <ActionIcon darkHidden variant="transparent" color="dark.4" size="md" radius="md">
              <Text fw={700}>{votes}</Text>
            </ActionIcon>
            <ActionIcon lightHidden variant="transparent" color="white" size="md" radius="md">
              <Text fw={700}>{votes}</Text>
            </ActionIcon>
            <ActionIcon
              variant="transparent"
              size="md"
              radius="md"
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

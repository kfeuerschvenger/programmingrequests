import classes from './IdeasList.module.css';

import { useGlobalContext } from '@/context';
import { getIdeasList } from '@/services';
import { Request } from '@/models';
import { useApi } from '@/hooks';

import { useEffect } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Avatar, Grid, Group, Paper, Space, Text, Title, TypographyStylesProvider } from '@mantine/core';

dayjs.extend(relativeTime);

const IdeasList = () => {
  const { value, setValue } = useGlobalContext();
  const { loading, error, data, fetch } = useApi<Request[], null>(getIdeasList, { autoFetch: true, params: null });

  useEffect(() => {
    if (value === 1) {
      fetch(null);
      setValue(0);
    }
  }, [value, fetch, setValue]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>UPS! There was an error: {error.message}</div>;
  }

  const ideas = data
    ? data.map(idea => (
        <Paper withBorder radius="md" className={classes.comment} key={idea.id}>
          <Group>
            <Avatar key={idea.author} name={idea.author} color="initials" />
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
        </Paper>
      ))
    : 'No previous ideas where found';

  return (
    <>
      <Title order={3}>Pool of ideas</Title>
      <Space h="lg" />
      <Grid>
        <Grid.Col span="auto"></Grid.Col>
        <Grid.Col span={8}>{ideas}</Grid.Col>
        <Grid.Col span="auto"></Grid.Col>
      </Grid>
    </>
  );
};

export default IdeasList;

import { useGlobalContext } from '@/context';
import { useApi } from '@/hooks';
import { Idea, IdeaPage } from '@/models';
import { getIdeasList } from '@/services';

import IdeaItem from './components/IdeaItem';

import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Button, Center, Grid, Space, Text, Title } from '@mantine/core';

dayjs.extend(relativeTime);

const FIRST_PAGE = 0;

const IdeasList = () => {
  const { ideasFlag, setIdeasFlag } = useGlobalContext();
  const options = { autoFetch: true, params: FIRST_PAGE, retry: 4, retryDelayMs: 1500 };
  const { loading, error, data, fetch } = useApi<IdeaPage, number>(getIdeasList, options);
  const [items, setItems] = useState<Idea[]>([]);

  // Page 0 replaces the list; any later page is appended, skipping ideas already shown because a new idea shifts the pages.
  useEffect(() => {
    if (!data) return;
    setItems(previous => {
      if (data.page === FIRST_PAGE) return data.items;
      const known = new Set(previous.map(idea => idea.id));
      return [...previous, ...data.items.filter(idea => !known.has(idea.id))];
    });
  }, [data]);

  // A new idea refreshes the list from page 0. Votes update their own row in place.
  useEffect(() => {
    if (ideasFlag === 1) {
      fetch(FIRST_PAGE);
      setIdeasFlag(0);
    }
  }, [ideasFlag]);

  if (loading && items.length === 0) {
    return <div>Loading...</div>;
  }

  if (error && items.length === 0) {
    return <div>UPS! There was an error: {error.message}</div>;
  }

  const hasMore = data !== null && data.page + 1 < data.totalPages;

  const ideas =
    items.length > 0 ? items.map(idea => <IdeaItem key={idea.id} idea={idea} />) : <div>No previous ideas where found</div>;

  return (
    <>
      <Title order={3}>Pool of ideas</Title>
      <Space h="xl" />
      <Grid>
        <Grid.Col span="auto"></Grid.Col>
        <Grid.Col span={8}>
          {ideas}
          {error && (
            <Text c="red" ta="center" fz="sm">
              {error.message}
            </Text>
          )}
          {hasMore && (
            <Center mt="md">
              <Button variant="light" loading={loading} onClick={() => fetch(data.page + 1)}>
                Load more
              </Button>
            </Center>
          )}
        </Grid.Col>
        <Grid.Col span="auto"></Grid.Col>
      </Grid>
    </>
  );
};

export default IdeasList;

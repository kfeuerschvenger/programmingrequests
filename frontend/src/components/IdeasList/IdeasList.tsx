import { useGlobalContext } from '@/context';
import { useApi } from '@/hooks';
import { Idea, IdeaPage } from '@/models';
import { getIdeasList } from '@/services';

import IdeaItem from './components/IdeaItem';

import { useEffect, useRef, useState } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Button, Center, Grid, Space, Text, Title } from '@mantine/core';

dayjs.extend(relativeTime);

const FIRST_PAGE = 0;

const IdeasList = () => {
  const { ideasFlag, setIdeasFlag } = useGlobalContext();
  const options = { retry: 4, retryDelayMs: 1500 };
  const { loading, error, fetch } = useApi<IdeaPage, number>(getIdeasList, options);
  const [items, setItems] = useState<Idea[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(FIRST_PAGE + 1);
  // Counts the requests started. Only the response of the latest one is applied: a refresh from page 0 resets the pagination, so a slower page requested before it must not be appended to the new list.
  const latestRequest = useRef(0);

  // Page 0 replaces the list; any later page is appended, skipping ideas already shown because a new idea shifts the pages.
  const load = async (page: number) => {
    const requestId = ++latestRequest.current;
    const { data } = await fetch(page);
    if (!data || requestId !== latestRequest.current) return;
    setItems(previous => {
      if (data.page === FIRST_PAGE) return data.items;
      const known = new Set(previous.map(idea => idea.id));
      return [...previous, ...data.items.filter(idea => !known.has(idea.id))];
    });
    setHasMore(data.page + 1 < data.totalPages);
    setNextPage(data.page + 1);
  };

  useEffect(() => {
    load(FIRST_PAGE);
  }, []);

  // A new idea refreshes the list from page 0. Votes update their own row in place.
  useEffect(() => {
    if (ideasFlag === 1) {
      load(FIRST_PAGE);
      setIdeasFlag(0);
    }
  }, [ideasFlag]);

  if (loading && items.length === 0) {
    return <div>Loading...</div>;
  }

  if (error && items.length === 0) {
    return <div>UPS! There was an error: {error.message}</div>;
  }

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
              <Button variant="light" loading={loading} onClick={() => load(nextPage)}>
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

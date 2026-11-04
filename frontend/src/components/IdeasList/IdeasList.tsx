import { useGlobalContext } from '@/context';
import { useApi } from '@/hooks';
import { IdeaPage } from '@/models';
import { getIdeasList } from '@/services';

import IdeaItem from './components/IdeaItem';

import { useEffect } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Grid, Space, Title } from '@mantine/core';

dayjs.extend(relativeTime);

const IdeasList = () => {
  const { ideasFlag, setIdeasFlag } = useGlobalContext();
  const options = { autoFetch: true, retry: 4, retryDelayMs: 1500 };
  const { loading, error, data, fetch } = useApi<IdeaPage, void>(getIdeasList, options);

  useEffect(() => {
    if (ideasFlag === 1) {
      fetch();
      setIdeasFlag(0);
    }
  }, [ideasFlag]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>UPS! There was an error: {error.message}</div>;
  }

  const items = data?.items ?? [];

  const ideas =
    items.length > 0 ? items.map(idea => <IdeaItem key={idea.id} idea={idea} />) : <div>No previous ideas where found</div>;

  return (
    <>
      <Title order={3}>Pool of ideas</Title>
      <Space h="xl" />
      <Grid>
        <Grid.Col span="auto"></Grid.Col>
        <Grid.Col span={8}>{ideas}</Grid.Col>
        <Grid.Col span="auto"></Grid.Col>
      </Grid>
    </>
  );
};

export default IdeasList;

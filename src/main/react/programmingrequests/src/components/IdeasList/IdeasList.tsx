import { useGlobalContext } from '@/context';
import { useApi } from '@/hooks';
import { IP, Request } from '@/models';
import { getPublicIp, getIdeasList } from '@/services';

import IdeaItem from './components/IdeaItem';

import { useEffect } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Grid, Space, Title } from '@mantine/core';

dayjs.extend(relativeTime);

const IdeasList = () => {
  const { ideasFlag, setIdeasFlag } = useGlobalContext();
  const options = { autoFetch: true, retry: 4, retryDelayMs: 1500 };
  const { loading, error, data = [], fetch } = useApi<Request[], void>(getIdeasList, options);
  const { data: ipData } = useApi<IP, void>(getPublicIp, options);

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

  const userIpAddress = ipData?.ip || '0.0.0.0';

  const ideas =
    Array.isArray(data) && data.length > 0 ? (
      data.map(idea => <IdeaItem key={idea.id} idea={idea} ipAddress={userIpAddress} />)
    ) : (
      <div>No previous ideas where found</div>
    );

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

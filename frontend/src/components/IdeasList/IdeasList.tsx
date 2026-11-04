import { Button, Center, Grid, SegmentedControl, Space, Title } from '@mantine/core';
import { useIdeas } from '@/hooks/useIdeas';
import { useListQueryState } from '@/hooks/useListQueryState';
import type { IdeaSort } from '@/types/ideas';
import { EmptyState, ErrorState, IdeaListSkeleton } from '@/components/ui';
import IdeaItem from './components/IdeaItem';

const SORT_OPTIONS: { value: IdeaSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Top' },
  { value: 'oldest', label: 'Oldest' },
];

const IdeasList = () => {
  const { sort, setSort } = useListQueryState();
  const { ideas, isPending, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useIdeas(sort);

  let content;
  if (isPending) {
    content = <IdeaListSkeleton />;
  } else if (isError && ideas.length === 0) {
    content = <ErrorState message={error.message} onRetry={() => void refetch()} retrying={isRefetching} />;
  } else if (ideas.length === 0) {
    content = <EmptyState message="No previous ideas where found" />;
  } else {
    content = (
      <>
        {ideas.map(idea => (
          <IdeaItem key={idea.id} idea={idea} />
        ))}
        {isError && <ErrorState message={error.message} onRetry={() => void fetchNextPage()} />}
        {hasNextPage && (
          <Center mt="md">
            <Button variant="light" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              Load more
            </Button>
          </Center>
        )}
      </>
    );
  }

  return (
    <>
      <Title order={3}>Pool of ideas</Title>
      <Space h="md" />
      <SegmentedControl aria-label="Sort ideas" size="xs" value={sort} onChange={setSort} data={SORT_OPTIONS} />
      <Space h="xl" />
      <Grid>
        <Grid.Col span="auto"></Grid.Col>
        <Grid.Col span={8}>{content}</Grid.Col>
        <Grid.Col span="auto"></Grid.Col>
      </Grid>
    </>
  );
};

export default IdeasList;

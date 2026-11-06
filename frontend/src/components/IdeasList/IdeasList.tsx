import { Button, SegmentedControl } from '@mantine/core';
import { useIdeas } from '@/hooks/useIdeas';
import { useListQueryState } from '@/hooks/useListQueryState';
import type { IdeaSort } from '@/types/ideas';
import { EmptyState, ErrorState, IdeaListSkeleton } from '@/components/ui';
import IdeaItem from './components/IdeaItem';
import classes from './IdeasList.module.css';

const SORT_OPTIONS: { value: IdeaSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Most backed' },
  { value: 'oldest', label: 'Oldest' },
];

const IdeasList = () => {
  const { sort, setSort } = useListQueryState();
  const {
    ideas,
    isPending,
    isError,
    isFetchNextPageError,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isPlaceholderData,
  } = useIdeas(sort);

  let content;
  if (isPending) {
    content = <IdeaListSkeleton />;
  } else if (isError && ideas.length === 0) {
    content = <ErrorState message={error.message} onRetry={() => void refetch()} retrying={isRefetching} />;
  } else if (ideas.length === 0) {
    content = (
      <EmptyState message="No quests are pinned yet. Post the first one above and let the guild have its say." />
    );
  } else {
    content = (
      <>
        <ul className={classes.grid}>
          {ideas.map(idea => (
            <IdeaItem key={idea.id} idea={idea} />
          ))}
        </ul>
        {isError && (
          // Retry what failed: the next page when that was the failed request, otherwise the list itself.
          <div className={classes.after}>
            <ErrorState
              message={error.message}
              onRetry={() => void (isFetchNextPageError ? fetchNextPage() : refetch())}
              retrying={isFetchNextPageError ? isFetchingNextPage : isRefetching}
            />
          </div>
        )}
        {/* While the previous sort is still shown as placeholder data, the next page would be fetched for the new sort. */}
        {hasNextPage && !isError && !isPlaceholderData && (
          <div className={classes.after}>
            <Button loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              Load more quests
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="quest-board-title" className={classes.board}>
      <div className={classes.head}>
        <h2 id="quest-board-title" className={classes.plank}>
          The Quest Board
        </h2>
        <SegmentedControl aria-label="Sort quests" value={sort} onChange={setSort} data={SORT_OPTIONS} />
      </div>
      <div
        role="region"
        aria-label="Quests"
        aria-busy={isPlaceholderData}
        className={`${classes.region} ${isPlaceholderData ? classes.stale : ''}`.trim()}
      >
        {content}
      </div>
    </section>
  );
};

export default IdeasList;

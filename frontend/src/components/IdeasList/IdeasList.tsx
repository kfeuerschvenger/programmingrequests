import { useMemo } from 'react';
import { Button, SegmentedControl } from '@mantine/core';
import { useIdeas } from '@/hooks/useIdeas';
import { useListQueryState } from '@/hooks/useListQueryState';
import type { IdeaSort } from '@/types/ideas';
import { art } from '@/components/Scene/assets';
import { Candle } from '@/components/Scene/Candle';
import { EmptyState, ErrorState, IdeaListSkeleton } from '@/components/ui';
import IdeaItem from './components/IdeaItem';
import classes from './IdeasList.module.css';
import { Masonry, type MasonryItem } from './Masonry';

const SORT_OPTIONS: { value: IdeaSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Most backed' },
  { value: 'oldest', label: 'Oldest' },
];

/** Where the decorative papers join the list, counted from the start of the list. On three columns, 4 falls in the middle column and 8 in the right one. A paper joins only once the list has reached its place. */
const DECORATIONS = [
  { at: 4, key: 'decoration-sword-shield', image: art.paperSwordShield, tilt: -3 },
  { at: 8, key: 'decoration-map', image: art.paperMap, tilt: 2.5 },
] as const;

/** Builds the masonry items: one per quest, with the decorative papers slipped in at their fixed places. */
const withDecorations = (quests: MasonryItem[]): MasonryItem[] => {
  const items = [...quests];
  for (const { at, key, image, tilt } of DECORATIONS) {
    if (quests.length <= at) continue;
    items.splice(at, 0, {
      key,
      decoration: true,
      node: (
        <img
          className={classes.decoration}
          style={{ transform: `rotate(${tilt}deg)` }}
          src={image.src}
          srcSet={image.srcSet}
          width={image.width}
          height={image.height}
          alt=""
          data-cast=""
          draggable={false}
        />
      ),
    });
  }
  return items;
};

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

  const items = useMemo(
    () => withDecorations(ideas.map(idea => ({ key: idea.id, node: <IdeaItem idea={idea} /> }))),
    [ideas],
  );

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
        <Masonry items={items} />
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
            <Button variant="wood" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
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
        <div className={classes.sort}>
          <Candle />
          <SegmentedControl aria-label="Sort quests" value={sort} onChange={setSort} data={SORT_OPTIONS} />
        </div>
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

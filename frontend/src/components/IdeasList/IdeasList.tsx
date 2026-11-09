import { useMemo } from 'react';
import { Button, SegmentedControl } from '@mantine/core';
import { useIdeas } from '@/hooks/useIdeas';
import { useListQueryState } from '@/hooks/useListQueryState';
import type { IdeaSort } from '@/types/ideas';
import { art } from '@/components/Scene/assets';
import { LiveAnnouncer } from '@/components/LiveAnnouncer/LiveAnnouncer';
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

/**
 * Where the decorative papers join the list. `before` is the number of quests that come before the paper, so the paper sits at that quest's place and the quest follows it. On three columns the papers land at positions 4 and 8 of the whole list, in the middle column and in the right one.
 * A paper joins in the same render that brings the quest after it, never later: the quests already on the board keep their column and their order when more of them are loaded.
 */
const DECORATIONS = [
  { before: 4, key: 'decoration-sword-shield', image: art.paperSwordShield, tilt: -3 },
  { before: 7, key: 'decoration-map', image: art.paperMap, tilt: 2.5 },
] as const;

const decorationItem = ({ key, image, tilt }: (typeof DECORATIONS)[number]): MasonryItem => ({
  key,
  decoration: true,
  // The paper and its nail turn together, so the nail stays in the same spot on the paper.
  node: (
    <div className={classes.decoration} style={{ transform: `rotate(${tilt}deg)` }} data-cast="">
      <img
        className={classes.paper}
        src={image.src}
        srcSet={image.srcSet}
        width={image.width}
        height={image.height}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <img
        className={classes.nail}
        src={art.nailFlush.src}
        srcSet={art.nailFlush.srcSet}
        width={art.nailFlush.width}
        height={art.nailFlush.height}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  ),
});

/** Builds the masonry items: one per quest, with the decorative papers slipped in at their fixed places. */
const withDecorations = (quests: MasonryItem[]): MasonryItem[] =>
  quests.flatMap((quest, index) => {
    const papers = DECORATIONS.filter(({ before }) => before === index).map(decorationItem);
    return [...papers, quest];
  });

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
    <>
      {/* A sibling of the board, not a child: assistive technology defers what is inside an aria-busy subtree, and a vote cast while the board re-sorts must still be announced. */}
      <LiveAnnouncer />
      {/* The section is the one landmark of the board. It carries aria-busy while a new sort is loading. */}
      <section aria-labelledby="quest-board-title" aria-busy={isPlaceholderData} className={classes.board}>
        <div className={classes.head}>
          <h2 id="quest-board-title" className={classes.plank}>
            The Quest Board
          </h2>
          <div className={classes.sort}>
            <Candle />
            <SegmentedControl aria-label="Sort quests" value={sort} onChange={setSort} data={SORT_OPTIONS} />
          </div>
        </div>
        <div className={`${classes.region} ${isPlaceholderData ? classes.stale : ''}`.trim()}>{content}</div>
      </section>
    </>
  );
};

export default IdeasList;

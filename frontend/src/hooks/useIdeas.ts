import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { IDEAS_PAGE_SIZE } from '@/config/constants';
import { listIdeas } from '@/services/ideas.service';
import type { Idea, IdeaSort } from '@/types/ideas';
import { ideasKeys } from './queryKeys';

/** Pages of ideas for one sort order, fetched on demand with "load more". */
export const useIdeas = (sort: IdeaSort) => {
  const query = useInfiniteQuery({
    queryKey: ideasKeys.list(sort),
    queryFn: ({ pageParam, signal }) => listIdeas({ page: pageParam, size: IDEAS_PAGE_SIZE, sort }, signal),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  // A new idea shifts the pages, so the same idea can appear in two of them: the first occurrence wins.
  const ideas = useMemo(() => {
    const seen = new Set<number>();
    const unique: Idea[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const idea of page.items) {
        if (!seen.has(idea.id)) {
          seen.add(idea.id);
          unique.push(idea);
        }
      }
    }
    return unique;
  }, [query.data]);

  return { ...query, ideas };
};

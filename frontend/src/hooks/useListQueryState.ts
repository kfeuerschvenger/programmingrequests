import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_SORT, IDEA_SORTS } from '@/config/constants';
import type { IdeaSort } from '@/types/ideas';

const isSort = (value: string | null): value is IdeaSort => IDEA_SORTS.some(sort => sort === value);

/** The list's sort order, kept in the URL as ?sort=. The default order leaves the URL clean and an unknown value falls back to it. */
export const useListQueryState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('sort');
  const sort: IdeaSort = isSort(raw) ? raw : DEFAULT_SORT;

  const setSort = useCallback(
    (next: IdeaSort) => {
      setSearchParams(
        previous => {
          const params = new URLSearchParams(previous);
          if (next === DEFAULT_SORT) params.delete('sort');
          else params.set('sort', next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { sort, setSort };
};

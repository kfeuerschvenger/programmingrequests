import type { IdeaSort } from '@/types/ideas';

export const ideasKeys = {
  all: ['ideas'] as const,
  lists: () => [...ideasKeys.all, 'list'] as const,
  list: (sort: IdeaSort) => [...ideasKeys.lists(), { sort }] as const,
};

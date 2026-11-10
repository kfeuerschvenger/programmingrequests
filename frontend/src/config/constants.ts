import type { IdeaSort } from '@/types/ideas';

/** Ideas fetched per request. The API accepts at most 50. */
export const IDEAS_PAGE_SIZE = 20;

export const DEFAULT_SORT: IdeaSort = 'newest';

export const IDEA_SORTS: readonly IdeaSort[] = ['newest', 'oldest', 'top'];

/** Limits shared with the API validation of a new idea. */
export const AUTHOR_MAX_LENGTH = 60;
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 1000;

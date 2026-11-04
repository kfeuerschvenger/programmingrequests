export type VoteValue = 1 | -1;

/** The caller's vote on an idea: 0 means no vote. */
export type MyVote = VoteValue | 0;

export type IdeaSort = 'newest' | 'oldest' | 'top';

export interface Idea {
  id: number;
  author: string | null;
  description: string;
  createdAt: string;
  score: number;
  myVote: MyVote;
}

export interface IdeaPage {
  items: Idea[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface NewIdea {
  author?: string;
  description: string;
}

export interface ListIdeasParams {
  page: number;
  size: number;
  sort: IdeaSort;
}

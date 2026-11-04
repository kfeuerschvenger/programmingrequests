export type VoteValue = 1 | -1;

export interface Idea {
  id: number;
  author: string | null;
  description: string;
  createdAt: string;
  score: number;
  myVote: -1 | 0 | 1;
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

export interface VoteArgs {
  ideaId: number;
  value: VoteValue;
}

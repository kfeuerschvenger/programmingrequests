export interface Request {
  id: number;
  author: string;
  description: string;
  date: string;
  upVotes: number;
}

export interface NewRequest {
  author: string;
  description: string;
}

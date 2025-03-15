export interface Request {
  id?: number;
  author: string;
  description: string;
  date: string;
  up_votes: number;
}

export interface NewRequest {
  author: string;
  description: string;
}

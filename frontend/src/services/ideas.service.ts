import { endpoints } from '@/config/api';
import type { Idea, IdeaPage, ListIdeasParams, NewIdea, VoteValue } from '@/types/ideas';
import { httpClient } from './http/httpClient';

export const listIdeas = async (params: ListIdeasParams, signal?: AbortSignal): Promise<IdeaPage> => {
  const { data } = await httpClient.get<IdeaPage>(endpoints.ideas(), { params, signal });
  return data;
};

export const getIdea = async (id: number, signal?: AbortSignal): Promise<Idea> => {
  const { data } = await httpClient.get<Idea>(endpoints.idea(id), { signal });
  return data;
};

export const createIdea = async (idea: NewIdea): Promise<Idea> => {
  const { data } = await httpClient.post<Idea>(endpoints.ideas(), idea);
  return data;
};

export const castVote = async (id: number, value: VoteValue): Promise<Idea> => {
  const { data } = await httpClient.put<Idea>(endpoints.vote(id), { value });
  return data;
};

export const withdrawVote = async (id: number): Promise<Idea> => {
  const { data } = await httpClient.delete<Idea>(endpoints.vote(id));
  return data;
};

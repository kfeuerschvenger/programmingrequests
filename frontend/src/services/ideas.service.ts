import { z } from 'zod';
import { endpoints } from '@/config/api';
import type { Idea, IdeaPage, ListIdeasParams, NewIdea, VoteValue } from '@/types/ideas';
import { ApiError } from './http/apiError';
import { httpClient } from './http/httpClient';

const ideaSchema = z.object({
  id: z.number(),
  author: z.string().nullable(),
  description: z.string(),
  createdAt: z.string(),
  score: z.number(),
  myVote: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

const pageSchema = z.object({
  items: z.array(ideaSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

/** Checks a response body against its schema so a 200 with an unexpected body cannot reach the UI. */
const parseResponse = <T>(
  schema: z.ZodType<T>,
  data: unknown,
  message = 'The server answered in a language we could not read. Please try again.',
): T => {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError({ kind: 'invalid_response', message });
  return result.data;
};

/** A create that reached the server but came back unreadable may have been stored, so asking for a plain retry would invite a duplicate. */
const CREATE_UNREADABLE_MESSAGE =
  'The server answered in a language we could not read, so your quest may have been posted. Check the board before posting it again.';

export const listIdeas = async (params: ListIdeasParams, signal?: AbortSignal): Promise<IdeaPage> => {
  const { data } = await httpClient.get<unknown>(endpoints.ideas(), { params, signal });
  return parseResponse(pageSchema, data);
};

export const createIdea = async (idea: NewIdea): Promise<Idea> => {
  const { data } = await httpClient.post<unknown>(endpoints.ideas(), idea);
  return parseResponse(ideaSchema, data, CREATE_UNREADABLE_MESSAGE);
};

export const castVote = async (id: number, value: VoteValue): Promise<Idea> => {
  const { data } = await httpClient.put<unknown>(endpoints.vote(id), { value });
  return parseResponse(ideaSchema, data);
};

export const withdrawVote = async (id: number): Promise<Idea> => {
  const { data } = await httpClient.delete<unknown>(endpoints.vote(id));
  return parseResponse(ideaSchema, data);
};

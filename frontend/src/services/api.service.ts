import { Idea, IdeaPage, NewIdea, UseApiCall, VoteArgs } from '@/models';
import { loadAbort } from '@/utils';
import axios from 'axios';

// Same-origin by default: nginx in production and the Vite dev proxy both forward /api to the backend.
// VITE_API_BASE_URL overrides the API root, for example http://localhost:8080/api.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const IDEAS_URL = `${BASE_URL}/ideas`;

const LIST_PAGE_SIZE = 50;

export const getIdeasList = (): UseApiCall<IdeaPage> => {
  const controller = loadAbort();

  return {
    call: axios.get<IdeaPage>(IDEAS_URL, {
      params: { page: 0, size: LIST_PAGE_SIZE, sort: 'newest' },
      signal: controller.signal,
    }),
    controller,
  };
};

export const newIdea = (idea: NewIdea): UseApiCall<Idea> => {
  const controller = loadAbort();

  return {
    call: axios.post<Idea>(IDEAS_URL, idea, { signal: controller.signal }),
    controller,
  };
};

export const voteIdea = ({ ideaId, value }: VoteArgs): UseApiCall<Idea> => {
  const controller = loadAbort();

  return {
    call: axios.put<Idea>(`${IDEAS_URL}/${ideaId}/vote`, { value }, { signal: controller.signal }),
    controller,
  };
};

export const withdrawVote = (ideaId: number): UseApiCall<Idea> => {
  const controller = loadAbort();

  return {
    call: axios.delete<Idea>(`${IDEAS_URL}/${ideaId}/vote`, { signal: controller.signal }),
    controller,
  };
};

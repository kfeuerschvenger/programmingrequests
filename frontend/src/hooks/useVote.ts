import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { castVote, withdrawVote } from '@/services/ideas.service';
import type { ApiError } from '@/services/http/apiError';
import type { Idea, IdeaPage, MyVote, VoteValue } from '@/types/ideas';
import { ideasKeys } from './queryKeys';

export interface VoteVariables {
  /** The idea as the user saw it when pressing the arrow. */
  idea: Idea;
  value: VoteValue;
}

type ListCache = InfiniteData<IdeaPage>;
type Snapshot = [QueryKey, ListCache | undefined][];

/** The vote that results from pressing an arrow: the active arrow withdraws, the other one switches. */
export const nextVote = (idea: Idea, value: VoteValue): MyVote => (idea.myVote === value ? 0 : value);

const patchIdea = (cache: ListCache | undefined, id: number, patch: (idea: Idea) => Idea) =>
  cache && {
    ...cache,
    pages: cache.pages.map(page => ({ ...page, items: page.items.map(idea => (idea.id === id ? patch(idea) : idea)) })),
  };

const failureMessage = (error: ApiError): { title: string; message: string } => {
  if (error.is('RATE_LIMITED')) {
    return {
      title: 'Too many votes',
      message: error.retryAfterSeconds
        ? `You are voting too fast. Try again in ${error.retryAfterSeconds} seconds.`
        : 'You are voting too fast. Try again in a moment.',
    };
  }
  if (error.is('CONFLICT')) {
    return { title: 'Vote not saved', message: 'Another vote on this idea was in progress. Please try again.' };
  }
  return { title: 'Voting not allowed', message: error.message };
};

/** Casts, switches or withdraws a vote, updating the score and the user's vote in every cached page at once. */
export const useVote = () => {
  const queryClient = useQueryClient();

  return useMutation<Idea, ApiError, VoteVariables, { snapshot: Snapshot }>({
    mutationFn: ({ idea, value }) => (nextVote(idea, value) === 0 ? withdrawVote(idea.id) : castVote(idea.id, value)),
    onMutate: async ({ idea, value }) => {
      await queryClient.cancelQueries({ queryKey: ideasKeys.lists() });
      const snapshot = queryClient.getQueriesData<ListCache>({ queryKey: ideasKeys.lists() });
      const vote = nextVote(idea, value);
      queryClient.setQueriesData<ListCache>({ queryKey: ideasKeys.lists() }, cache =>
        patchIdea(cache, idea.id, current => ({
          ...current,
          myVote: vote,
          score: current.score - current.myVote + vote,
        })),
      );
      return { snapshot };
    },
    onError: (error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      notifications.show({ color: 'red', ...failureMessage(error) });
    },
    onSuccess: updated => {
      // The server answer is the truth: it replaces the optimistic guess.
      queryClient.setQueriesData<ListCache>({ queryKey: ideasKeys.lists() }, cache =>
        patchIdea(cache, updated.id, () => updated),
      );
      notifications.show({
        color: 'teal',
        title: updated.myVote === 0 ? 'Vote withdrawn' : 'Vote submitted!',
        message: updated.myVote === 0 ? 'Your vote on this idea is gone.' : 'Thank you for your feedback on this idea!',
      });
    },
  });
};

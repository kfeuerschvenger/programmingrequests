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
type Previous = Pick<Idea, 'score' | 'myVote'>;
/** What one cached list held for the voted idea before the optimistic update. */
type PreviousByList = [QueryKey, Previous][];

const VOTE_MUTATION_KEY = ['ideas', 'vote'] as const;

/** The vote that results from pressing an arrow: the active arrow withdraws, the other one switches. */
export const nextVote = (idea: Idea, value: VoteValue): MyVote => (idea.myVote === value ? 0 : value);

const patchIdea = (cache: ListCache | undefined, id: number, patch: (idea: Idea) => Idea) =>
  cache && {
    ...cache,
    pages: cache.pages.map(page => ({ ...page, items: page.items.map(idea => (idea.id === id ? patch(idea) : idea)) })),
  };

const findIdea = (cache: ListCache | undefined, id: number): Idea | undefined => {
  for (const page of cache?.pages ?? []) {
    const found = page.items.find(idea => idea.id === id);
    if (found) return found;
  }
  return undefined;
};

const isRateLimited = (error: ApiError) => error.is('RATE_LIMITED') || (error.code === null && error.status === 429);
const isConflict = (error: ApiError) => error.is('CONFLICT') || (error.code === null && error.status === 409);

/** The code decides first and the status is the fallback; failures that say nothing about the vote itself get a neutral title. */
const failureMessage = (error: ApiError): { title: string; message: string } => {
  if (isRateLimited(error)) {
    return {
      title: 'Too many votes',
      message: error.retryAfterSeconds
        ? `You are voting too fast. Try again in ${error.retryAfterSeconds} seconds.`
        : 'You are voting too fast. Try again in a moment.',
    };
  }
  if (isConflict(error)) {
    return { title: 'Vote not saved', message: 'Another vote on this idea was in progress. Please try again.' };
  }
  const transport = error.kind !== 'http' || (error.status !== null && error.status >= 500);
  return { title: transport ? 'Vote not saved' : 'Voting not allowed', message: error.message };
};

/**
 * Casts, switches or withdraws a vote on one idea, updating the score and the user's vote in every cached page at once.
 * Votes on the same idea run one after another; a failure restores only that idea, never the rest of the cache.
 */
export const useVote = (ideaId: number) => {
  const queryClient = useQueryClient();

  return useMutation<Idea, ApiError, VoteVariables, { previous: PreviousByList }>({
    mutationKey: VOTE_MUTATION_KEY,
    scope: { id: `vote-${ideaId}` },
    mutationFn: ({ idea, value }) => (nextVote(idea, value) === 0 ? withdrawVote(idea.id) : castVote(idea.id, value)),
    onMutate: ({ idea, value }) => {
      const previous: PreviousByList = [];
      for (const [key, cache] of queryClient.getQueriesData<ListCache>({ queryKey: ideasKeys.lists() })) {
        const current = findIdea(cache, idea.id);
        if (current) previous.push([key, { score: current.score, myVote: current.myVote }]);
      }
      const vote = nextVote(idea, value);
      queryClient.setQueriesData<ListCache>({ queryKey: ideasKeys.lists() }, cache =>
        patchIdea(cache, idea.id, current => ({
          ...current,
          myVote: vote,
          score: current.score - current.myVote + vote,
        })),
      );
      return { previous };
    },
    onError: (error, { idea }, context) => {
      context?.previous.forEach(([key, before]) =>
        queryClient.setQueryData<ListCache>(key, cache =>
          patchIdea(cache, idea.id, current => ({ ...current, ...before })),
        ),
      );
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
    onSettled: () => {
      // Reconcile with the server once the last vote in flight has settled: refetching earlier would overwrite another idea's optimistic state.
      if (queryClient.isMutating({ mutationKey: VOTE_MUTATION_KEY }) <= 1) {
        void queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
      }
    },
  });
};

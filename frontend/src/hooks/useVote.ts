import { useMutation, useQueryClient, type InfiniteData, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { castVote, withdrawVote } from '@/services/ideas.service';
import { isConflict, isRateLimited, type ApiError } from '@/services/http/apiError';
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

/** Identifies the votes on one idea, so a component can tell that one is in flight whichever instance started it. */
export const voteMutationKey = (ideaId: number) => [...VOTE_MUTATION_KEY, ideaId] as const;

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

/** Only a refusal of the user's identity or permission says the vote is not allowed; every other failure says only that it was not saved. */
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
  const refused = error.kind === 'http' && (error.status === 401 || error.status === 403);
  return { title: refused ? 'Voting not allowed' : 'Vote not saved', message: error.message };
};

/**
 * Stops the list refetches in flight so their answer cannot overwrite an optimistic patch made after they started.
 * A "Load more" fetch is left alone, and so is a first load: neither is a reconciliation of data the vote can change.
 * Cancelling reverts a query to the state it had when the fetch began, so the data it holds now is put back afterwards.
 */
const cancelListRefetches = async (queryClient: QueryClient) => {
  const refetching = queryClient
    .getQueryCache()
    .findAll({ queryKey: ideasKeys.lists(), fetchStatus: 'fetching' })
    .filter(query => query.state.data !== undefined && !query.state.fetchMeta?.fetchMore);
  await Promise.all(
    refetching.map(async query => {
      const data = query.state.data as ListCache;
      await queryClient.cancelQueries({ queryKey: query.queryKey, exact: true });
      if (query.state.data !== data) queryClient.setQueryData<ListCache>(query.queryKey, data);
    }),
  );
};

/**
 * Casts, switches or withdraws a vote on one idea, updating the score and the user's vote in every cached page at once.
 * Votes on the same idea run one after another; a failure restores only that idea, never the rest of the cache.
 */
export const useVote = (ideaId: number) => {
  const queryClient = useQueryClient();

  return useMutation<Idea, ApiError, VoteVariables, { previous: PreviousByList }>({
    mutationKey: voteMutationKey(ideaId),
    scope: { id: `vote-${ideaId}` },
    mutationFn: ({ idea, value }) => (nextVote(idea, value) === 0 ? withdrawVote(idea.id) : castVote(idea.id, value)),
    onMutate: async ({ idea, value }) => {
      await cancelListRefetches(queryClient);
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

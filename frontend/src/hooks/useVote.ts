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

/** A timeout, a network error or an unreadable answer arrive after the request left, so the server may have stored the vote. */
const isUncertain = (error: ApiError) =>
  error.kind === 'timeout' || error.kind === 'network' || error.kind === 'invalid_response';

/** Only a refusal of the user's identity or permission says the vote is not allowed. An uncertain outcome says the vote may not have been saved, never that it was not; every other failure says it was not saved. */
const failureMessage = (error: ApiError): { title: string; message: string } => {
  if (isRateLimited(error)) {
    return {
      title: 'Easy there, adventurer',
      message: error.retryAfterSeconds
        ? `You are voting too fast. Try again in ${error.retryAfterSeconds} seconds.`
        : 'You are voting too fast. Try again in a moment.',
    };
  }
  if (isConflict(error)) {
    return { title: 'Vote not saved', message: 'Another vote on this quest was in progress. Please try again.' };
  }
  if (isUncertain(error)) {
    return {
      title: 'Vote may not have been saved',
      message: `${error.message} The board will refresh to show where your vote stands.`,
    };
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
 *
 * The optimistic patch is not defended against every refetch: a "Load more" in flight, or a refetch that was paused while the browser was offline, can land after the patch and briefly show the score the server had before the vote.
 * The invalidation in `onSettled` reconciles it, so the list always ends on the server's answer.
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
        color: 'green',
        title: updated.myVote === 0 ? 'Vote withdrawn' : 'Vote sealed',
        message:
          updated.myVote === 0 ? 'Your vote has left the board.' : 'Your vote is on the board. The guild thanks you.',
      });
    },
    onSettled: () => {
      // Reconcile with the server once the last vote in flight has settled: refetching earlier would overwrite another idea's optimistic state.
      // `cancelRefetch: false` joins a fetch already in flight instead of cancelling it, so a "Load more" the user just pressed is not thrown away.
      if (queryClient.isMutating({ mutationKey: VOTE_MUTATION_KEY }) <= 1) {
        void queryClient.invalidateQueries({ queryKey: ideasKeys.lists() }, { cancelRefetch: false });
      }
    },
  });
};

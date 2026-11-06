import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createIdea } from '@/services/ideas.service';
import { isConflict, isRateLimited, type ApiError } from '@/services/http/apiError';
import type { NewIdea } from '@/types/ideas';
import { ideasKeys } from './queryKeys';

const MAY_BE_POSTED_TITLE = 'Quest may have been posted';

/**
 * A timeout or a network error comes after the request left, and an invalid response means the request reached the server, so in every one of these cases the quest may exist.
 * The wording sends the user to the board instead of inviting a second post.
 */
const failureMessage = (error: ApiError): { title: string; message: string } => {
  if (isRateLimited(error)) {
    return {
      title: 'Easy there, adventurer',
      message: error.retryAfterSeconds
        ? `You are posting too fast. Try again in ${error.retryAfterSeconds} seconds.`
        : 'You are posting too fast. Try again in a moment.',
    };
  }
  if (isConflict(error)) {
    return { title: 'Quest not posted', message: 'Another request was in progress. Please try again.' };
  }
  if (error.kind === 'timeout' || error.kind === 'network') {
    return {
      title: MAY_BE_POSTED_TITLE,
      message: `${error.message} Your quest may already be on the board, so check it before posting again.`,
    };
  }
  if (error.kind === 'invalid_response') {
    return { title: MAY_BE_POSTED_TITLE, message: error.message };
  }
  return { title: 'Quest not posted', message: error.message };
};

/** Creates an idea and refreshes every cached list so it shows up at once. */
export const useCreateIdea = () => {
  const queryClient = useQueryClient();

  return useMutation<Awaited<ReturnType<typeof createIdea>>, ApiError, NewIdea>({
    mutationFn: createIdea,
    onSuccess: () => {
      notifications.show({
        title: 'Quest posted',
        message: 'Your quest is pinned to the board. May a hero answer the call.',
        color: 'green',
      });
    },
    onError: error => {
      // Field errors are shown next to their inputs by the form, which also notifies any that map to no input.
      if (error.fieldErrors.length > 0) return;
      notifications.show({ color: 'red', ...failureMessage(error) });
    },
    // Any outcome refreshes the lists: a response that fails validation may still have created the idea on the server.
    // Not awaited: the mutation settles, and the form resets and re-enables, without waiting for the list refetch.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
    },
  });
};

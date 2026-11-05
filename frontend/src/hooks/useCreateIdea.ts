import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createIdea } from '@/services/ideas.service';
import { isConflict, isRateLimited, type ApiError } from '@/services/http/apiError';
import type { NewIdea } from '@/types/ideas';
import { ideasKeys } from './queryKeys';

/** An invalid response means the request reached the server, so the idea may exist even though the answer could not be read. */
const failureMessage = (error: ApiError): { title: string; message: string } => {
  if (isRateLimited(error)) {
    return {
      title: 'Slow down',
      message: error.retryAfterSeconds
        ? `You are submitting too fast. Try again in ${error.retryAfterSeconds} seconds.`
        : 'You are submitting too fast. Try again in a moment.',
    };
  }
  if (isConflict(error)) {
    return { title: 'Idea not submitted', message: 'Another request was in progress. Please try again.' };
  }
  if (error.kind === 'invalid_response') {
    return { title: 'Idea may have been posted', message: error.message };
  }
  return { title: 'Idea not submitted', message: error.message };
};

/** Creates an idea and refreshes every cached list so it shows up at once. */
export const useCreateIdea = () => {
  const queryClient = useQueryClient();

  return useMutation<Awaited<ReturnType<typeof createIdea>>, ApiError, NewIdea>({
    mutationFn: createIdea,
    onSuccess: () => {
      notifications.show({
        title: 'Idea submitted!',
        message: 'Thank you for sharing your idea!',
        color: 'teal',
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

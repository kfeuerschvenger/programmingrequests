import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createIdea } from '@/services/ideas.service';
import type { ApiError } from '@/services/http/apiError';
import type { NewIdea } from '@/types/ideas';
import { ideasKeys } from './queryKeys';

/** Creates an idea and refreshes every cached list so it shows up at once. */
export const useCreateIdea = () => {
  const queryClient = useQueryClient();

  return useMutation<Awaited<ReturnType<typeof createIdea>>, ApiError, NewIdea>({
    mutationFn: createIdea,
    onSuccess: async () => {
      notifications.show({
        title: 'Idea submitted!',
        message: 'Thank you for sharing your idea!',
        color: 'teal',
      });
      await queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
    },
    onError: error => {
      // Field errors are shown next to their inputs by the form.
      if (error.fieldErrors.length > 0) return;
      notifications.show({
        title: error.is('RATE_LIMITED') ? 'Slow down' : 'Idea not submitted',
        message:
          error.is('RATE_LIMITED') && error.retryAfterSeconds
            ? `You are submitting too fast. Try again in ${error.retryAfterSeconds} seconds.`
            : error.message,
        color: 'red',
      });
    },
  });
};

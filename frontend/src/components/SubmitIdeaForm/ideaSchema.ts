import { z } from 'zod';
import { AUTHOR_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, DESCRIPTION_MIN_LENGTH } from '@/config/constants';

/** Mirrors the API validation of a new idea. An empty author means anonymous. */
export const ideaSchema = z.object({
  author: z.string().trim().max(AUTHOR_MAX_LENGTH, 'Even a mastermind needs a shorter name (60 characters at most)'),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN_LENGTH, "Hey! I can't read minds, you know... (10 characters at least)")
    .max(DESCRIPTION_MAX_LENGTH, 'Even legends fit in 1000 characters'),
});

export type IdeaFormValues = z.infer<typeof ideaSchema>;

import { z } from 'zod';
import { AUTHOR_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, DESCRIPTION_MIN_LENGTH } from '@/config/constants';

/** Mirrors the API validation of a new idea. An empty author means anonymous. */
export const ideaSchema = z.object({
  author: z
    .string()
    .trim()
    .max(AUTHOR_MAX_LENGTH, `That name will not fit on the guild roll: ${AUTHOR_MAX_LENGTH} characters at most.`),
  description: z
    .string()
    .trim()
    .min(
      DESCRIPTION_MIN_LENGTH,
      `Give the heroes more to go on: ${DESCRIPTION_MIN_LENGTH} characters at least. Even a rumour has more words.`,
    )
    .max(DESCRIPTION_MAX_LENGTH, `Even legends fit in ${DESCRIPTION_MAX_LENGTH} characters. Trim the tale.`),
});

export type IdeaFormValues = z.infer<typeof ideaSchema>;

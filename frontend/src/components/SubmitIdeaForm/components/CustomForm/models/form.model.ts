import { z } from 'zod';

export const schema = z.object({
  author: z.string().trim().max(60, 'Even a mastermind needs a shorter name (60 characters at most)'),
  description: z
    .string()
    .trim()
    .min(10, "Hey! I can't read minds, you know... (10 characters at least)")
    .max(1000, 'Even legends fit in 1000 characters'),
});

export type FormValues = z.infer<typeof schema>;

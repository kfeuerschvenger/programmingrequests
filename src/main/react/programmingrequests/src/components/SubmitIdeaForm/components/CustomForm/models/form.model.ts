import { z } from 'zod';

export const schema = z.object({
  author: z.string().min(1, 'We need the name of the mastermind behind this idea'),
  description: z.string().min(1, "Hey! I can't read minds, you know..."),
});

export type FormValues = z.infer<typeof schema>;

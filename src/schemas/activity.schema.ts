import { z } from 'zod';

export const activityQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  entityType: z.enum(['Project', 'Task', 'Comment', 'Subtask']).optional(),
  action: z.string().optional(),
});

export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;

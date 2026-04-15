import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  position: z.number().int().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .object({
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
      interval: z.number().int().min(1).optional(),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  position: z.number().int().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .object({
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
      interval: z.number().int().min(1).optional(),
      endDate: z.string().datetime().optional(),
    })
    .optional()
    .nullable(),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(255),
  isDone: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  isDone: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const addAssigneeSchema = z.object({
  userId: z.string().min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type AddAssigneeInput = z.infer<typeof addAssigneeSchema>;

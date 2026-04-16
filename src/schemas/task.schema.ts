import { z } from 'zod';

// Task enums - consistent types for use in repositories
const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
const PriorityEnum = z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  dueDate: z.iso.datetime().optional(),
  startDate: z.iso.datetime().optional(),
  position: z.number().int().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .object({
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
      interval: z.number().int().min(1).optional(),
      endDate: z.iso.datetime().optional(),
    })
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  dueDate: z.iso.datetime().optional().nullable(),
  startDate: z.iso.datetime().optional().nullable(),
  completedAt: z.iso.datetime().optional().nullable(),
  position: z.number().int().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .object({
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
      interval: z.number().int().min(1).optional(),
      endDate: z.iso.datetime().optional(),
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

// Export types for use in repositories
export type TaskStatusInput = z.infer<typeof TaskStatusEnum>;
export type PriorityInput = z.infer<typeof PriorityEnum>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type AddAssigneeInput = z.infer<typeof addAssigneeSchema>;

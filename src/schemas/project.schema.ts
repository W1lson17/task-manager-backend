import { z } from 'zod';

// Member roles enum
const MemberRole = z.enum(['ADMIN', 'MEMBER', 'VIEWER']);
export type MemberRoleInput = z.infer<typeof MemberRole>;

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#3B82F6')
    .optional(),
  slug: z.string().min(1).max(100).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  dueDate: z.iso.datetime().optional().nullable(),
});

export const addMemberSchema = z.object({
  email: z.email(),
  role: MemberRole.default('MEMBER'),
});

export const projectQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;

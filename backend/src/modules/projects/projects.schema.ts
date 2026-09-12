import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').optional(),
  description: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

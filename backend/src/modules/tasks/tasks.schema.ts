import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'dueDate must be a valid date string',
  }),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'dueDate must be a valid date string',
  }).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const filterTaskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  overdueOnly: z.enum(['true', 'false']).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type FilterTaskQueryInput = z.infer<typeof filterTaskQuerySchema>;

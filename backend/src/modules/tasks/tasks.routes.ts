import { FastifyInstance } from 'fastify';
import { TasksService } from './tasks.service.js';
import {
  createTaskSchema,
  filterTaskQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from './tasks.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

export async function tasksRoutes(fastify: FastifyInstance) {
  const tasksService = new TasksService(fastify.prisma);

  fastify.get('/', { preHandler: [authenticate] }, async (request) => {
    const query = filterTaskQuerySchema.parse(request.query);
    const tasks = await tasksService.getTasks(request.user!, query);
    return sendSuccess(tasks);
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const task = await tasksService.getTaskById(id, request.user!);
    return sendSuccess(task);
  });

  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const input = createTaskSchema.parse(request.body);
    const task = await tasksService.createTask(input, request.user!);
    return reply.status(201).send(sendSuccess(task));
  });

  fastify.patch('/:id/status', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const input = updateTaskStatusSchema.parse(request.body);
    const task = await tasksService.updateTaskStatus(id, input, request.user!);
    return sendSuccess(task);
  });

  fastify.put('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const input = updateTaskSchema.parse(request.body);
    const task = await tasksService.updateTask(id, input, request.user!);
    return sendSuccess(task);
  });

  fastify.delete('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const result = await tasksService.deleteTask(id, request.user!);
    return sendSuccess(result);
  });
}

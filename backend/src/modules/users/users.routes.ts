import { FastifyInstance } from 'fastify';
import { UsersService } from './users.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRole } from '../../middleware/rbac.middleware.js';
import { sendSuccess } from '../../utils/response.js';
import { z } from 'zod';
import { Role } from '@prisma/client';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role),
});

export async function usersRoutes(fastify: FastifyInstance) {
  const usersService = new UsersService(fastify.prisma);

  fastify.get('/', { preHandler: [authenticate] }, async (request) => {
    const users = await usersService.getUsers(request.user!);
    return sendSuccess(users);
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const user = await usersService.getUserById(id, request.user!);
    return sendSuccess(user);
  });

  fastify.post(
    '/',
    { preHandler: [authenticate, authorizeRole(Role.ADMIN)] },
    async (request, reply) => {
      const input = createUserSchema.parse(request.body);
      const result = await usersService.createUser(input, request.user!);
      return reply.status(201).send(sendSuccess(result));
    }
  );

  fastify.delete(
    '/:id',
    { preHandler: [authenticate, authorizeRole(Role.ADMIN)] },
    async (request) => {
      const { id } = request.params as { id: string };
      const result = await usersService.deleteUser(id, request.user!);
      return sendSuccess(result);
    }
  );
}

import { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma);

  fastify.post('/register', async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const user = await authService.register(input);
    return reply.status(201).send(sendSuccess(user));
  });

  fastify.post('/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(request, reply, input);
    return sendSuccess(result);
  });

  fastify.post('/refresh', async (request, reply) => {
    const result = await authService.refreshAccessToken(request, reply);
    return sendSuccess(result);
  });

  fastify.post('/logout', async (request, reply) => {
    const result = await authService.logout(request, reply);
    return sendSuccess(result);
  });

  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getCurrentUser(request.user!.id);
    return sendSuccess(user);
  });
}

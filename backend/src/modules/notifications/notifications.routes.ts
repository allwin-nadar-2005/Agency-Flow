import { FastifyInstance } from 'fastify';
import { NotificationsService } from './notifications.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

export async function notificationsRoutes(fastify: FastifyInstance) {
  const service = new NotificationsService(fastify.prisma);

  fastify.get('/', { preHandler: [authenticate] }, async (request) => {
    const notifications = await service.getUserNotifications(request.user!.id);
    return sendSuccess(notifications);
  });

  fastify.get('/unread-count', { preHandler: [authenticate] }, async (request) => {
    const res = await service.getUnreadCount(request.user!.id);
    return sendSuccess(res);
  });

  fastify.patch('/:id/read', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const notification = await service.markAsRead(id, request.user!.id);
    return sendSuccess(notification);
  });

  fastify.patch('/read-all', { preHandler: [authenticate] }, async (request) => {
    const result = await service.markAllAsRead(request.user!.id);
    return sendSuccess(result);
  });
}

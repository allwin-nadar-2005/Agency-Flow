import { FastifyInstance } from 'fastify';
import { ActivityService } from './activity.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

export async function activityRoutes(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  fastify.get('/', { preHandler: [authenticate] }, async (request) => {
    const { limit } = request.query as { limit?: string };
    const logs = await activityService.getActivityFeed(
      request.user!,
      limit ? parseInt(limit, 10) : 50
    );
    return sendSuccess(logs);
  });

  fastify.get('/catchup', { preHandler: [authenticate] }, async (request) => {
    const { limit } = request.query as { limit?: string };
    const logs = await activityService.getCatchupEvents(
      request.user!,
      limit ? parseInt(limit, 10) : 20
    );
    return sendSuccess(logs);
  });
}

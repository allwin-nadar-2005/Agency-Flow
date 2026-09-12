import { FastifyInstance } from 'fastify';
import { DashboardService } from './dashboard.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  const dashboardService = new DashboardService(fastify.prisma);

  fastify.get('/stats', { preHandler: [authenticate] }, async (request) => {
    const stats = await dashboardService.getDashboardStats(request.user!);
    return sendSuccess(stats);
  });
}

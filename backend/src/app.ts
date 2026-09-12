import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import prismaPlugin from './plugins/prisma.plugin.js';
import { sendError } from './utils/response.js';
import { AppError } from './utils/errors.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { activityRoutes } from './modules/activity/activity.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
  });

  // Register Core Plugins
  await app.register(cors, {
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
  });

  await app.register(prismaPlugin);

  // Healthcheck Route
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register Module Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(projectsRoutes, { prefix: '/api/projects' });
  await app.register(tasksRoutes, { prefix: '/api/tasks' });
  await app.register(activityRoutes, { prefix: '/api/activity' });
  await app.register(notificationsRoutes, { prefix: '/api/notifications' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });

  // Standardized Error Handler
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(sendError(error.message, error.code));
    }

    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return reply
        .status(400)
        .send(sendError(issue?.message || 'Invalid input data', 'VALIDATION_ERROR', error.issues));
    }

    app.log.error(error);

    return reply
      .status(error.statusCode || 500)
      .send(sendError('Internal server error occurred', 'INTERNAL_SERVER_ERROR'));
  });

  return app;
}

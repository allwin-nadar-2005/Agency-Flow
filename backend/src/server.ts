import { buildApp } from './app.js';
import { env } from './config/env.js';
import { initSocketServer } from './realtime/socket.server.js';
import { startOverdueTaskCronJob } from './jobs/overdueTask.job.js';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Fastify REST API running on http://${env.HOST}:${env.PORT}`);

    // Initialize Socket.IO with HTTP Server
    const httpServer = app.server;
    initSocketServer(httpServer, app.prisma);
    console.log('⚡ Socket.IO Real-time server ready for connections');

    // Start node-cron background job
    startOverdueTaskCronJob(app.prisma);
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
}

start();

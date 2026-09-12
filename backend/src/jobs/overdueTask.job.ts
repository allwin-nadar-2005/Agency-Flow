import cron from 'node-cron';
import { PrismaClient, TaskStatus, NotificationType } from '@prisma/client';
import { getSocketServer } from '../realtime/socket.server.js';
import { env } from '../config/env.js';

export function startOverdueTaskCronJob(prisma: PrismaClient) {
  console.log(`⏰ Scheduled Overdue Task Cron Job initialized with pattern: "${env.OVERDUE_JOB_CRON}"`);

  cron.schedule(env.OVERDUE_JOB_CRON, async () => {
    await processOverdueTasks(prisma);
  });
}

export async function processOverdueTasks(prisma: PrismaClient) {
  const now = new Date();
  console.log(`🔍 Running Overdue Task Check at ${now.toISOString()}...`);

  try {
    // Find uncompleted tasks that passed due date but are not yet flagged as overdue
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: TaskStatus.COMPLETED },
        isOverdue: false,
      },
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (overdueTasks.length === 0) {
      console.log('✅ No new overdue tasks detected.');
      return { processedCount: 0 };
    }

    console.log(`🚨 Found ${overdueTasks.length} newly overdue task(s). Updating state...`);

    let processedCount = 0;

    for (const task of overdueTasks) {
      const io = getSocketServer();

      // Transaction per task to guarantee duplicate-safe processing
      await prisma.$transaction(async (tx) => {
        // Double check state inside transaction
        const current = await tx.task.findUnique({ where: { id: task.id } });
        if (!current || current.isOverdue || current.status === TaskStatus.COMPLETED) {
          return;
        }

        const updatedTask = await tx.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
        });

        // 1. Create System Activity Log
        const activity = await tx.activityLog.create({
          data: {
            projectId: task.projectId,
            taskId: task.id,
            actorId: task.project.ownerId, // System / Project Owner reference
            action: 'TASK_OVERDUE_FLAGGED',
            message: `Task #${task.title} passed due date (${task.dueDate.toLocaleDateString()}) and is marked OVERDUE.`,
          },
          include: {
            actor: { select: { id: true, name: true, email: true } },
          },
        });

        // 2. Create Notification for Assignee (if assigned)
        let notification = null;
        if (task.assigneeId) {
          notification = await tx.notification.create({
            data: {
              recipientId: task.assigneeId,
              type: NotificationType.TASK_OVERDUE,
              title: 'Task Overdue Alert',
              message: `Task "${task.title}" is overdue! Due date was ${task.dueDate.toLocaleDateString()}`,
              taskId: task.id,
            },
          });
        }

        // Emit real-time updates after transaction success
        if (io) {
          io.broadcastActivity(activity);
          if (notification) {
            io.sendNotification(notification);
          }
          io.emitTaskUpdated(updatedTask);
        }

        processedCount++;
      });
    }

    console.log(`✅ Finished processing ${processedCount} overdue task(s).`);
    return { processedCount };
  } catch (error) {
    console.error('❌ Error executing overdue task cron job:', error);
    return { processedCount: 0, error };
  }
}

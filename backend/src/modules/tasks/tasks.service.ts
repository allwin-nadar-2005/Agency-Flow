import { PrismaClient, Role, TaskStatus, NotificationType } from '@prisma/client';
import {
  CreateTaskInput,
  FilterTaskQueryInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from './tasks.schema.js';
import { UserPayload } from '../../types/index.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { getSocketServer } from '../../realtime/socket.server.js';

export class TasksService {
  constructor(private prisma: PrismaClient) {}

  async getTasks(user: UserPayload, query: FilterTaskQueryInput) {
    const where: any = {};

    // 1. Apply Query Filters
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.projectId) where.projectId = query.projectId;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.overdueOnly === 'true') where.isOverdue = true;

    // 2. Role-Based Scoping Constraints
    if (user.role === Role.DEVELOPER) {
      // Developers can ONLY see tasks assigned to them
      where.assigneeId = user.id;
    } else if (user.role === Role.PROJECT_MANAGER) {
      // PMs can ONLY see tasks belonging to projects they created
      where.project = { ownerId: user.id };
    }
    // ADMIN has global visibility

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { isOverdue: 'desc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return tasks;
  }

  async getTaskById(id: string, user: UserPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
        activityLogs: {
          include: { actor: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.DEVELOPER && task.assigneeId !== user.id) {
      throw new ForbiddenError('You cannot view tasks assigned to other developers.');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You cannot view tasks from projects you do not own.');
    }

    return task;
  }

  async createTask(input: CreateTaskInput, user: UserPayload) {
    if (user.role !== Role.PROJECT_MANAGER) {
      throw new ForbiddenError('Only Project Managers are authorized to create and assign tasks.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.ownerId !== user.id) {
      throw new ForbiddenError('You can only create tasks for projects that you created.');
    }

    const dueDateObj = new Date(input.dueDate);
    const isOverdue = dueDateObj < new Date() && input.assigneeId != null;

    const result = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          priority: input.priority,
          dueDate: dueDateObj,
          isOverdue,
          assigneeId: input.assigneeId || null,
        },
        include: {
          project: { select: { id: true, title: true, ownerId: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      let notification = null;
      if (task.assigneeId) {
        notification = await tx.notification.create({
          data: {
            recipientId: task.assigneeId,
            type: NotificationType.TASK_ASSIGNED,
            title: 'New Task Assigned',
            message: `${user.name} assigned you to task: "${task.title}"`,
            taskId: task.id,
          },
        });
      }

      const activity = await tx.activityLog.create({
        data: {
          projectId: task.projectId,
          taskId: task.id,
          actorId: user.id,
          action: 'TASK_CREATED',
          message: `${user.name} created Task #${task.title}`,
        },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      });

      return { task, notification, activity };
    });

    const io = getSocketServer();
    if (io) {
      io.broadcastActivity(result.activity);
      if (result.notification) {
        io.sendNotification(result.notification);
      }
    }

    return result.task;
  }

  async updateTaskStatus(id: string, input: UpdateTaskStatusInput, user: UserPayload) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, title: true, ownerId: true } } },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    // STRICT PERMISSION: Only the assigned DEVELOPER can update task status
    if (user.role !== Role.DEVELOPER || existingTask.assigneeId !== user.id) {
      throw new ForbiddenError('Only the assigned Developer can update task status.');
    }

    if (existingTask.status === input.status) {
      return existingTask;
    }

    const previousStatus = existingTask.status;

    const result = await this.prisma.$transaction(async (tx) => {
      const isCompleted = input.status === TaskStatus.COMPLETED;
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: input.status,
          isOverdue: isCompleted ? false : existingTask.isOverdue,
        },
        include: {
          project: { select: { id: true, title: true, ownerId: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      const activity = await tx.activityLog.create({
        data: {
          projectId: updatedTask.projectId,
          taskId: updatedTask.id,
          actorId: user.id,
          action: 'TASK_STATUS_CHANGED',
          previousStatus,
          newStatus: input.status,
          message: `${user.name} moved Task #${updatedTask.title} from ${previousStatus} → ${input.status}`,
        },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      });

      let notification = null;
      if (input.status === TaskStatus.IN_REVIEW && existingTask.project.ownerId !== user.id) {
        notification = await tx.notification.create({
          data: {
            recipientId: existingTask.project.ownerId,
            type: NotificationType.TASK_IN_REVIEW,
            title: 'Task Ready for Review',
            message: `${user.name} moved task "${updatedTask.title}" to IN_REVIEW`,
            taskId: updatedTask.id,
          },
        });
      }

      return { task: updatedTask, activity, notification };
    });

    const io = getSocketServer();
    if (io) {
      io.broadcastActivity(result.activity);
      if (result.notification) {
        io.sendNotification(result.notification);
      }
      io.emitTaskUpdated(result.task);
    }

    return result.task;
  }

  async updateTask(id: string, input: UpdateTaskInput, user: UserPayload) {
    if (user.role !== Role.PROJECT_MANAGER) {
      throw new ForbiddenError('Only Project Managers can update task details.');
    }

    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, ownerId: true } } },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    if (existingTask.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only update tasks in your own projects.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const previousAssigneeId = existingTask.assigneeId;

      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...(input.title ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.priority ? { priority: input.priority } : {}),
          ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
          ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        },
        include: {
          project: { select: { id: true, title: true, ownerId: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      let notification = null;
      if (
        input.assigneeId &&
        input.assigneeId !== previousAssigneeId &&
        input.assigneeId !== user.id
      ) {
        notification = await tx.notification.create({
          data: {
            recipientId: input.assigneeId,
            type: NotificationType.TASK_ASSIGNED,
            title: 'New Task Assigned',
            message: `${user.name} assigned you to task: "${updatedTask.title}"`,
            taskId: updatedTask.id,
          },
        });
      }

      const activity = await tx.activityLog.create({
        data: {
          projectId: updatedTask.projectId,
          taskId: updatedTask.id,
          actorId: user.id,
          action: 'TASK_UPDATED',
          message: `${user.name} updated details for Task #${updatedTask.title}`,
        },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      });

      return { task: updatedTask, activity, notification };
    });

    const io = getSocketServer();
    if (io) {
      io.broadcastActivity(result.activity);
      if (result.notification) {
        io.sendNotification(result.notification);
      }
      io.emitTaskUpdated(result.task);
    }

    return result.task;
  }

  async deleteTask(id: string, user: UserPayload) {
    if (user.role !== Role.PROJECT_MANAGER) {
      throw new ForbiddenError('Only Project Managers can delete tasks.');
    }

    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, ownerId: true } } },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    if (existingTask.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only delete tasks belonging to your own projects.');
    }

    await this.prisma.task.delete({ where: { id } });
    return { message: 'Task deleted successfully' };
  }
}

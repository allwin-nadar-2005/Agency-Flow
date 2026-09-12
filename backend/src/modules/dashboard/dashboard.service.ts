import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import { UserPayload } from '../../types/index.js';
import { getSocketServer } from '../../realtime/socket.server.js';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getDashboardStats(user: UserPayload) {
    const io = getSocketServer();
    const liveOnlineUserCount = io ? io.getOnlineUserCount() : 0;

    if (user.role === Role.ADMIN) {
      const [
        totalUsers,
        totalProjects,
        totalTasks,
        overdueCount,
        statusCountsRaw,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.task.count(),
        this.prisma.task.count({ where: { isOverdue: true } }),
        this.prisma.task.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ]);

      const statusSummary = {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        COMPLETED: 0,
      };

      statusCountsRaw.forEach((sc) => {
        statusSummary[sc.status] = sc._count._all;
      });

      return {
        role: Role.ADMIN,
        totalUsers,
        totalProjects,
        totalTasks,
        overdueCount,
        liveOnlineUserCount,
        statusSummary,
      };
    }

    if (user.role === Role.PROJECT_MANAGER) {
      const pmProjectWhere = { ownerId: user.id };
      const pmTaskWhere = { project: { ownerId: user.id } };

      const [
        myProjectsCount,
        totalTasks,
        overdueCount,
        statusCountsRaw,
        priorityCountsRaw,
        upcomingTasks,
      ] = await Promise.all([
        this.prisma.project.count({ where: pmProjectWhere }),
        this.prisma.task.count({ where: pmTaskWhere }),
        this.prisma.task.count({ where: { ...pmTaskWhere, isOverdue: true } }),
        this.prisma.task.groupBy({
          by: ['status'],
          where: pmTaskWhere,
          _count: { _all: true },
        }),
        this.prisma.task.groupBy({
          by: ['priority'],
          where: pmTaskWhere,
          _count: { _all: true },
        }),
        this.prisma.task.findMany({
          where: {
            ...pmTaskWhere,
            status: { not: TaskStatus.COMPLETED },
          },
          take: 5,
          orderBy: { dueDate: 'asc' },
          include: {
            assignee: { select: { id: true, name: true } },
            project: { select: { id: true, title: true } },
          },
        }),
      ]);

      const statusSummary = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, COMPLETED: 0 };
      statusCountsRaw.forEach((sc) => {
        statusSummary[sc.status] = sc._count._all;
      });

      const prioritySummary = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
      priorityCountsRaw.forEach((pc) => {
        prioritySummary[pc.priority] = pc._count._all;
      });

      return {
        role: Role.PROJECT_MANAGER,
        myProjectsCount,
        totalTasks,
        overdueCount,
        statusSummary,
        prioritySummary,
        upcomingTasks,
      };
    }

    // DEVELOPER
    const devTaskWhere = { assigneeId: user.id };

    const [
      totalTasks,
      overdueCount,
      completedCount,
      inProgressCount,
      inReviewCount,
      priorityCountsRaw,
      upcomingTasks,
    ] = await Promise.all([
      this.prisma.task.count({ where: devTaskWhere }),
      this.prisma.task.count({ where: { ...devTaskWhere, isOverdue: true } }),
      this.prisma.task.count({ where: { ...devTaskWhere, status: TaskStatus.COMPLETED } }),
      this.prisma.task.count({ where: { ...devTaskWhere, status: TaskStatus.IN_PROGRESS } }),
      this.prisma.task.count({ where: { ...devTaskWhere, status: TaskStatus.IN_REVIEW } }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: devTaskWhere,
        _count: { _all: true },
      }),
      this.prisma.task.findMany({
        where: {
          ...devTaskWhere,
          status: { not: TaskStatus.COMPLETED },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          project: { select: { id: true, title: true } },
        },
      }),
    ]);

    const prioritySummary = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    priorityCountsRaw.forEach((pc) => {
      prioritySummary[pc.priority] = pc._count._all;
    });

    return {
      role: Role.DEVELOPER,
      totalTasks,
      overdueCount,
      completedCount,
      inProgressCount,
      inReviewCount,
      prioritySummary,
      upcomingTasks,
    };
  }
}

import { PrismaClient, Role } from '@prisma/client';
import { UserPayload } from '../../types/index.js';

export class ActivityService {
  constructor(private prisma: PrismaClient) {}

  async getActivityFeed(user: UserPayload, limit = 50) {
    const where: any = {};

    if (user.role === Role.PROJECT_MANAGER) {
      // PM sees activity on their projects performed by DEVELOPERS (not Admin or other PMs)
      where.project = { ownerId: user.id };
      where.actor = { role: Role.DEVELOPER };
    } else if (user.role === Role.DEVELOPER) {
      // Developer receives activity for tasks assigned to them performed by DEVELOPERS (not PM or Admin)
      where.actor = { role: Role.DEVELOPER };
      where.OR = [
        { task: { assigneeId: user.id } },
        { project: { tasks: { some: { assigneeId: user.id } } } },
      ];
    }
    // Admin receives global activity across all roles (PMs and Developers)

    const logs = await this.prisma.activityLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        project: { select: { id: true, title: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    });

    return logs;
  }

  async getCatchupEvents(user: UserPayload, limit = 20) {
    return this.getActivityFeed(user, Math.min(limit, 20));
  }
}

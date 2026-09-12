import { PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';

export class NotificationsService {
  constructor(private prisma: PrismaClient) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        task: { select: { id: true, title: true, status: true, projectId: true } },
      },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new ForbiddenError('You cannot read another user’s notifications.');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }
}

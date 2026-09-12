import { Socket } from 'socket.io';
import { PrismaClient, Role } from '@prisma/client';
import { UserPayload } from '../types/index.js';

export class RoomManager {
  constructor(private prisma: PrismaClient) {}

  async joinUserRooms(socket: Socket, user: UserPayload) {
    // 1. Join Personal User Room (for direct notifications)
    socket.join(`room:user:${user.id}`);

    if (user.role === Role.ADMIN) {
      // 2. Admin joins Global Activity Room
      socket.join('room:admin');
      return;
    }

    if (user.role === Role.PROJECT_MANAGER) {
      // 3. PM joins all owned project rooms
      const ownedProjects = await this.prisma.project.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });

      ownedProjects.forEach((p) => {
        socket.join(`room:project:${p.id}`);
      });
      return;
    }

    if (user.role === Role.DEVELOPER) {
      // 4. Developer joins rooms for projects containing assigned tasks
      const assignedProjects = await this.prisma.project.findMany({
        where: {
          tasks: {
            some: { assigneeId: user.id },
          },
        },
        select: { id: true },
      });

      assignedProjects.forEach((p) => {
        socket.join(`room:project:${p.id}`);
      });
    }
  }
}

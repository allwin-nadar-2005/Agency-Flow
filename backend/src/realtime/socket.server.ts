import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { RoomManager } from './room.manager.js';
import { UserPayload } from '../types/index.js';
import { env } from '../config/env.js';

let ioInstance: SocketServer | null = null;

export class SocketServer {
  private io: Server;
  private roomManager: RoomManager;
  private activeUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(httpServer: HttpServer, prisma: PrismaClient) {
    this.roomManager = new RoomManager(prisma);
    this.io = new Server(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupAuthMiddleware();
    this.setupEventHandlers();
  }

  private setupAuthMiddleware() {
    this.io.use((socket: Socket & { user?: UserPayload }, next) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Unauthorized socket connection'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: Socket & { user?: UserPayload }) => {
      const user = socket.user!;

      // Track online user presence
      if (!this.activeUsers.has(user.id)) {
        this.activeUsers.set(user.id, new Set());
      }
      this.activeUsers.get(user.id)!.add(socket.id);

      // Join role-aware rooms
      await this.roomManager.joinUserRooms(socket, user);

      // Emit live presence update to Admin global room
      this.broadcastPresence();

      socket.on('disconnect', () => {
        const userSockets = this.activeUsers.get(user.id);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.activeUsers.delete(user.id);
          }
        }
        this.broadcastPresence();
      });
    });
  }

  public broadcastPresence() {
    const count = this.activeUsers.size;
    this.io.to('room:admin').emit('presence:update', {
      onlineUserCount: count,
    });
  }

  public getOnlineUserCount(): number {
    return this.activeUsers.size;
  }

  public broadcastActivity(activity: any) {
    // 1. Emit to Admin global room
    this.io.to('room:admin').emit('activity:created', activity);

    // 2. Emit to project room
    if (activity.projectId) {
      this.io.to(`room:project:${activity.projectId}`).emit('activity:created', activity);
    }
  }

  public sendNotification(notification: any) {
    // Emit directly to recipient's private user room
    this.io.to(`room:user:${notification.recipientId}`).emit('notification:new', notification);
  }

  public emitTaskUpdated(task: any) {
    this.io.to(`room:project:${task.projectId}`).emit('task:updated', task);
    if (task.assigneeId) {
      this.io.to(`room:user:${task.assigneeId}`).emit('task:updated', task);
    }
  }
}

export function initSocketServer(httpServer: HttpServer, prisma: PrismaClient): SocketServer {
  ioInstance = new SocketServer(httpServer, prisma);
  return ioInstance;
}

export function getSocketServer(): SocketServer | null {
  return ioInstance;
}

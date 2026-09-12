import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserPayload } from '../../types/index.js';
import { ForbiddenError, NotFoundError, ConflictError } from '../../utils/errors.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async getUsers(currentUser: UserPayload) {
    if (currentUser.role === Role.ADMIN) {
      return this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.role === Role.PROJECT_MANAGER) {
      // PMs can view developers for task assignment
      return this.prisma.user.findMany({
        where: { role: Role.DEVELOPER },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });
    }

    // Developer can only view self
    return this.prisma.user.findMany({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getUserById(id: string, currentUser: UserPayload) {
    if (
      currentUser.role !== Role.ADMIN &&
      currentUser.role !== Role.PROJECT_MANAGER &&
      currentUser.id !== id
    ) {
      throw new ForbiddenError('You can only view your own user profile.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return user;
  }

  async createUser(input: CreateUserInput, currentUser: UserPayload) {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only Administrators can create new user accounts.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      user,
      credentials: {
        email: input.email,
        temporaryPassword: input.password,
        role: input.role,
      },
    };
  }

  async deleteUser(id: string, currentUser: UserPayload) {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only Administrators can delete user accounts.');
    }

    if (currentUser.id === id) {
      throw new ForbiddenError('You cannot delete your own active Admin account.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}

import { PrismaClient, Role } from '@prisma/client';
import { CreateProjectInput, UpdateProjectInput } from './projects.schema.js';
import { UserPayload } from '../../types/index.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';

export class ProjectsService {
  constructor(private prisma: PrismaClient) {}

  async getProjects(user: UserPayload) {
    if (user.role === Role.ADMIN) {
      // Admin views all projects globally
      return this.prisma.project.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.PROJECT_MANAGER) {
      // PM views only projects created by them
      return this.prisma.project.findMany({
        where: { ownerId: user.id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // DEVELOPER: only return projects where developer has assigned tasks
    return this.prisma.project.findMany({
      where: {
        tasks: {
          some: { assigneeId: user.id },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(id: string, user: UserPayload) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Role-based security checks
    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      throw new ForbiddenError('You do not have access to another Project Manager’s project.');
    }

    if (user.role === Role.DEVELOPER) {
      const hasTask = project.tasks.some((t) => t.assigneeId === user.id);
      if (!hasTask) {
        throw new ForbiddenError('You do not have access to this project.');
      }
      // Developers should only see their own tasks in the project detail view
      project.tasks = project.tasks.filter((t) => t.assigneeId === user.id);
    }

    return project;
  }

  async createProject(input: CreateProjectInput, user: UserPayload) {
    // ONLY Project Managers create projects per assessment specification matrix
    if (user.role !== Role.PROJECT_MANAGER) {
      throw new ForbiddenError('Only Project Managers are authorized to create projects.');
    }

    const project = await this.prisma.project.create({
      data: {
        title: input.title,
        description: input.description,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return project;
  }

  async updateProject(id: string, input: UpdateProjectInput, user: UserPayload) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    // Admin can manage all projects; PM can only update projects they created
    if (user.role !== Role.ADMIN && existing.ownerId !== user.id) {
      throw new ForbiddenError('You can only update projects that you created.');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return updated;
  }

  async deleteProject(id: string, user: UserPayload) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    // Admin can manage/delete all projects; PM can only delete projects they created
    if (user.role !== Role.ADMIN && existing.ownerId !== user.id) {
      throw new ForbiddenError('You can only delete projects that you created.');
    }

    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted successfully' };
  }
}

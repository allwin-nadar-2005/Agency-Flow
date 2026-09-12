import { FastifyInstance } from 'fastify';
import { ProjectsService } from './projects.service.js';
import { createProjectSchema, updateProjectSchema } from './projects.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

export async function projectsRoutes(fastify: FastifyInstance) {
  const projectsService = new ProjectsService(fastify.prisma);

  fastify.get('/', { preHandler: [authenticate] }, async (request) => {
    const projects = await projectsService.getProjects(request.user!);
    return sendSuccess(projects);
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const project = await projectsService.getProjectById(id, request.user!);
    return sendSuccess(project);
  });

  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const input = createProjectSchema.parse(request.body);
    const project = await projectsService.createProject(input, request.user!);
    return reply.status(201).send(sendSuccess(project));
  });

  fastify.put('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const input = updateProjectSchema.parse(request.body);
    const project = await projectsService.updateProject(id, input, request.user!);
    return sendSuccess(project);
  });

  fastify.delete('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const result = await projectsService.deleteProject(id, request.user!);
    return sendSuccess(result);
  });
}

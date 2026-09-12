import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export function authorizeRole(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError(
        `Role '${request.user.role}' is not authorized to perform this operation.`
      );
    }
  };
}

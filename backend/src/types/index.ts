import { Role } from '@prisma/client';
import '@fastify/jwt';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../utils/errors.js';
import { UserPayload } from '../types/index.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or malformed');
    }

    const decoded = await request.jwtVerify<UserPayload>();
    request.user = decoded;
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

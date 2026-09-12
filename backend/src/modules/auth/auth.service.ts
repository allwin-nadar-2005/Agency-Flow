import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LoginInput, RegisterInput } from './auth.schema.js';
import { UnauthorizedError, ConflictError } from '../../utils/errors.js';
import { UserPayload } from '../../types/index.js';
import { env } from '../../config/env.js';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role || Role.DEVELOPER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(request: FastifyRequest, reply: FastifyReply, input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = request.server.jwt.sign(payload, {
      expiresIn: env.JWT_ACCESS_EXPIRATION,
    });

    const refreshToken = request.server.jwt.sign(payload, {
      expiresIn: env.JWT_REFRESH_EXPIRATION,
    });

    // Store refresh token record in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Set HttpOnly Cookie for refresh token
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    };
  }

  async refreshAccessToken(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token missing from cookie');
    }

    let decoded: UserPayload;
    try {
      decoded = request.server.jwt.verify<UserPayload>(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is revoked or expired');
    }

    // Revoke old refresh token and issue a new pair (Refresh Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const payload: UserPayload = {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      name: tokenRecord.user.name,
    };

    const newAccessToken = request.server.jwt.sign(payload, {
      expiresIn: env.JWT_ACCESS_EXPIRATION,
    });

    const newRefreshToken = request.server.jwt.sign(payload, {
      expiresIn: env.JWT_REFRESH_EXPIRATION,
    });

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt: newExpiresAt,
      },
    });

    reply.setCookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      user: payload,
      accessToken: newAccessToken,
    };
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;

    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }

    reply.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
    });

    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }
}

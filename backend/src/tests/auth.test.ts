import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import bcrypt from 'bcryptjs';

describe('Auth & Refresh Token Rotation Flow', () => {
  let app: FastifyInstance;
  const testEmail = `auth-test-${Date.now()}@agency.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const pwdHash = await bcrypt.hash(testPassword, 10);
    await app.prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: pwdHash,
        name: 'Auth Test User',
        role: 'DEVELOPER',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('Logs in successfully and sets HttpOnly refreshToken cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: testEmail, password: testPassword },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();

    // Verify HttpOnly cookie header
    const cookies = res.cookies;
    const refreshCookie = cookies.find((c) => c.name === 'refreshToken');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);
  });

  it('Refreshes access token and rotates refresh cookie', async () => {
    // 1. Login to get cookie
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: testEmail, password: testPassword },
    });

    const refreshCookie = loginRes.cookies.find((c) => c.name === 'refreshToken');

    // 2. Call refresh endpoint with cookie
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: refreshCookie!.value },
    });

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.json().data.accessToken).toBeDefined();
  });

  it('Fails authentication with invalid credentials (401 Unauthorized)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: testEmail, password: 'WrongPassword!' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });
});

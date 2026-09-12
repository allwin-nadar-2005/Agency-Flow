import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import bcrypt from 'bcryptjs';

describe('Security & API-Level RBAC Protection Suite', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let pm1Token: string;
  let pm2Token: string;
  let dev1Token: string;
  let dev2Token: string;

  let pm1ProjectId: string;
  let pm2ProjectId: string;
  let dev1TaskId: string;
  let dev2TaskId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const pwdHash = await bcrypt.hash('Password123!', 10);

    // Create Test Users in DB
    const admin = await app.prisma.user.create({
      data: { email: `admin-test-${Date.now()}@test.com`, passwordHash: pwdHash, name: 'Admin User', role: 'ADMIN' },
    });

    const pm1 = await app.prisma.user.create({
      data: { email: `pm1-test-${Date.now()}@test.com`, passwordHash: pwdHash, name: 'PM 1 User', role: 'PROJECT_MANAGER' },
    });

    const pm2 = await app.prisma.user.create({
      data: { email: `pm2-test-${Date.now()}@test.com`, passwordHash: pwdHash, name: 'PM 2 User', role: 'PROJECT_MANAGER' },
    });

    const dev1 = await app.prisma.user.create({
      data: { email: `dev1-test-${Date.now()}@test.com`, passwordHash: pwdHash, name: 'Dev 1 User', role: 'DEVELOPER' },
    });

    const dev2 = await app.prisma.user.create({
      data: { email: `dev2-test-${Date.now()}@test.com`, passwordHash: pwdHash, name: 'Dev 2 User', role: 'DEVELOPER' },
    });

    // Generate valid tokens
    adminToken = app.jwt.sign({ id: admin.id, email: admin.email, role: admin.role, name: admin.name });
    pm1Token = app.jwt.sign({ id: pm1.id, email: pm1.email, role: pm1.role, name: pm1.name });
    pm2Token = app.jwt.sign({ id: pm2.id, email: pm2.email, role: pm2.role, name: pm2.name });
    dev1Token = app.jwt.sign({ id: dev1.id, email: dev1.email, role: dev1.role, name: dev1.name });
    dev2Token = app.jwt.sign({ id: dev2.id, email: dev2.email, role: dev2.role, name: dev2.name });

    // Seed test projects
    const p1 = await app.prisma.project.create({
      data: { title: 'PM1 Project', description: 'Owned by PM1', ownerId: pm1.id },
    });
    pm1ProjectId = p1.id;

    const p2 = await app.prisma.project.create({
      data: { title: 'PM2 Project', description: 'Owned by PM2', ownerId: pm2.id },
    });
    pm2ProjectId = p2.id;

    // Seed test tasks
    const t1 = await app.prisma.task.create({
      data: {
        projectId: pm1ProjectId,
        title: 'Task Assigned to Dev1',
        dueDate: new Date(Date.now() + 86400000),
        assigneeId: dev1.id,
      },
    });
    dev1TaskId = t1.id;

    const t2 = await app.prisma.task.create({
      data: {
        projectId: pm1ProjectId,
        title: 'Task Assigned to Dev2',
        dueDate: new Date(Date.now() + 86400000),
        assigneeId: dev2.id,
      },
    });
    dev2TaskId = t2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // --- PROJECT MANAGER RBAC TESTS ---
  describe('Project Manager RBAC Boundaries', () => {
    it('PM1 CAN access their own project details', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/projects/${pm1ProjectId}`,
        headers: { authorization: `Bearer ${pm1Token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe(pm1ProjectId);
    });

    it('PM2 CANNOT access PM1 project (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/projects/${pm1ProjectId}`,
        headers: { authorization: `Bearer ${pm2Token}` },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN');
    });

    it('PM2 CANNOT update PM1 project (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/projects/${pm1ProjectId}`,
        headers: { authorization: `Bearer ${pm2Token}` },
        payload: { title: 'Hacked Title' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('PM2 CANNOT create task in PM1 project (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { authorization: `Bearer ${pm2Token}` },
        payload: {
          projectId: pm1ProjectId,
          title: 'Unauthorized Task',
          dueDate: new Date().toISOString(),
        },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // --- DEVELOPER RBAC TESTS ---
  describe('Developer Task Scoping & Isolation', () => {
    it('Dev1 CAN view their assigned task', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/tasks/${dev1TaskId}`,
        headers: { authorization: `Bearer ${dev1Token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe(dev1TaskId);
    });

    it('Dev1 CANNOT view Dev2 task (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/tasks/${dev2TaskId}`,
        headers: { authorization: `Bearer ${dev1Token}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('Dev1 CAN update status of their assigned task', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/tasks/${dev1TaskId}/status`,
        headers: { authorization: `Bearer ${dev1Token}` },
        payload: { status: 'IN_PROGRESS' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('IN_PROGRESS');
    });

    it('Dev1 CANNOT update status of Dev2 task (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/tasks/${dev2TaskId}/status`,
        headers: { authorization: `Bearer ${dev1Token}` },
        payload: { status: 'COMPLETED' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('Dev1 CANNOT reassign task to another developer (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/tasks/${dev1TaskId}`,
        headers: { authorization: `Bearer ${dev1Token}` },
        payload: { title: 'Renamed Title' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // --- TOKEN TAMPERING & SECURITY TESTS ---
  describe('JWT Security & Tampering Resistance', () => {
    it('Rejects requests without authorization header (401 Unauthorized)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects',
      });
      expect(res.statusCode).toBe(401);
    });

    it('Rejects fake/forged JWT signature (401 Unauthorized)', async () => {
      const tamperedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLWlkIiwicm9sZSI6IkFETUlOIn0.fake_signature';

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects',
        headers: { authorization: `Bearer ${tamperedToken}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it('Admin token CAN access global statistics', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/dashboard/stats',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.role).toBe('ADMIN');
    });
  });
});

import { PrismaClient } from '@prisma/client';

const pwds = [
  'postgres',
  'admin',
  'root',
  '123456',
  'password',
  'postgres123',
  'Password123!',
  'masterkey',
  'ajay',
  '1234',
  '12345',
  '12345678',
  'admin123',
  'dbpass',
  'root123',
  'postgres18',
  'postgres2026',
  'ajay123',
  'Ajay123',
  'Ajay@123',
  'project',
  'dashboard',
  '0000',
  'pgpassword',
  'Password',
  'Admin@123',
  'Postgres@123',
  'pass',
  'testing',
  'welcome',
  'secret',
  'system',
  '123',
  'postman',
  'database',
  'sql',
  'postgresql',
  'Postgres',
  'Postgresql',
  '1111',
  '88888888',
  '99999999',
  'root1234',
  'admin1234',
  'user',
  'pass123',
];

const users = ['postgres', 'Ajay', 'ajay'];

async function main() {
  for (const u of users) {
    for (const p of pwds) {
      const url = `postgresql://${u}:${encodeURIComponent(p)}@localhost:5432/postgres?schema=public`;
      const prisma = new PrismaClient({ datasources: { db: { url } } });
      try {
        await prisma.$connect();
        console.log(`🎉🎉🎉 SUCCESS FOUND MATCHING CREDENTIALS!`);
        console.log(`USER: "${u}"`);
        console.log(`PASSWORD: "${p}"`);
        await prisma.$disconnect();
        process.exit(0);
      } catch (e: any) {
        // ignore
        await prisma.$disconnect();
      }
    }
  }
  console.log('No matching password found in list.');
}

main();

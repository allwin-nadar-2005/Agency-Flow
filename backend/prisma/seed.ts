import { PrismaClient, Role, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Executing complete seed script per assessment requirements...');

  // Clean existing database records
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users (1 Admin, 2 PMs, 4 Developers)
  console.log('👤 Creating users...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Amara Admin',
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'pm1@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Ravi Manager (Alpha)',
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'pm2@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Sarah Manager (Beta)',
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'dev1@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Divya Dev',
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'dev2@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Alex Dev',
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'dev3@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Chen Dev',
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'dev4@agency.com',
      passwordHash: defaultPasswordHash,
      name: 'Elena Dev',
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Users created: Admin (1), PMs (2), Devs (4)');

  // 2. Seed Projects (3 Projects with ownership boundaries)
  console.log('📁 Creating projects...');

  const project1 = await prisma.project.create({
    data: {
      title: 'E-Commerce Re-platforming',
      description: 'Modernizing legacy storefront to Next.js & Node.js backend architecture with high scalability.',
      ownerId: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Mobile App Redesign',
      description: 'Cross-platform iOS and Android mobile app update focusing on UI polish and biometrics auth.',
      ownerId: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'Cloud Infrastructure Migration',
      description: 'Migrating microservices from on-prem servers to AWS EKS with Terraform & GitHub Actions CI/CD.',
      ownerId: pm2.id,
    },
  });

  console.log('✅ Projects created: 3 projects');

  // 3. Seed Tasks (15 Tasks, at least 5 per project, 2 overdue)
  console.log('📋 Creating tasks...');

  const now = new Date();
  const pastDue1 = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
  const pastDue2 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const futureDue1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead
  const futureDue2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

  const tasksData = [
    // Project 1 Tasks (PM1 - Ravi)
    {
      projectId: project1.id,
      title: 'Setup PostgreSQL Database Schema & Prisma ORM',
      description: 'Design normalized tables for users, projects, tasks, activity logs and setup initial migrations.',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: pastDue1,
      isOverdue: false,
      assigneeId: dev1.id,
    },
    {
      projectId: project1.id,
      title: 'Implement Payment Gateway Webhook Handlers',
      description: 'Secure Stripe webhook endpoints with signature validation and idempotent processing.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      dueDate: pastDue2,
      isOverdue: true, // OVERDUE TASK 1
      assigneeId: dev1.id,
    },
    {
      projectId: project1.id,
      title: 'Integrate Redis Cache for Catalog API',
      description: 'Cache high-frequency product catalog list calls with TTL of 5 minutes.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDue1,
      isOverdue: false,
      assigneeId: dev2.id,
    },
    {
      projectId: project1.id,
      title: 'Build Shopping Cart & Checkout React Components',
      description: 'Implement responsive cart summary with item count badges and discount code input.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureDue2,
      isOverdue: false,
      assigneeId: dev1.id,
    },
    {
      projectId: project1.id,
      title: 'Write End-to-End Cypress Tests for Checkout',
      description: 'Automate checkout user flow including test card payment submission.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDue2,
      isOverdue: false,
      assigneeId: dev2.id,
    },

    // Project 2 Tasks (PM1 - Ravi)
    {
      projectId: project2.id,
      title: 'Configure Push Notifications via Firebase Cloud Messaging',
      description: 'Setup FCM tokens registration and handle background alert triggers.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: pastDue1,
      isOverdue: true, // OVERDUE TASK 2
      assigneeId: dev2.id,
    },
    {
      projectId: project2.id,
      title: 'Design Biometric Authentication Flow (FaceID / TouchID)',
      description: 'Implement native fallback for biometric user authentication in React Native.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDue1,
      isOverdue: false,
      assigneeId: dev3.id,
    },
    {
      projectId: project2.id,
      title: 'Audit App Store Accessibility Compliance',
      description: 'Ensure color contrast ratio meets WCAG AA standard and screen readers work cleanly.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDue2,
      isOverdue: false,
      assigneeId: dev3.id,
    },
    {
      projectId: project2.id,
      title: 'Optimize Image Assets for Retina Displays',
      description: 'Convert PNG assets to WebP format and setup responsive image loader.',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.LOW,
      dueDate: pastDue2,
      isOverdue: false,
      assigneeId: dev2.id,
    },
    {
      projectId: project2.id,
      title: 'Implement Dark Mode Theme Switcher',
      description: 'Add Tailwind dark mode class toggle and persist user theme preference.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDue1,
      isOverdue: false,
      assigneeId: dev1.id,
    },

    // Project 3 Tasks (PM2 - Sarah)
    {
      projectId: project3.id,
      title: 'Provision Terraform Scripts for AWS EKS Cluster',
      description: 'Create multi-AZ Kubernetes cluster with managed node pools and IAM roles.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      dueDate: futureDue1,
      isOverdue: false,
      assigneeId: dev4.id,
    },
    {
      projectId: project3.id,
      title: 'Setup Prometheus & Grafana Monitoring Dashboards',
      description: 'Configure pod CPU, memory, network alerts and Discord webhook alerts.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: futureDue2,
      isOverdue: false,
      assigneeId: dev4.id,
    },
    {
      projectId: project3.id,
      title: 'Automate GitHub Actions Deployment Pipeline',
      description: 'Build Docker containers, run security scanning with Trivy, push to ECR, deploy to helm.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureDue1,
      isOverdue: false,
      assigneeId: dev4.id,
    },
    {
      projectId: project3.id,
      title: 'Perform Disaster Recovery & Failover Simulation',
      description: 'Simulate zone outage and measure automatic DNS failover latency.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDue2,
      isOverdue: false,
      assigneeId: dev3.id,
    },
    {
      projectId: project3.id,
      title: 'Configure SSL/TLS Certificates with Let\'s Encrypt Cert-Manager',
      description: 'Automate wild-card SSL cert renewal via DNS-01 challenges on Route53.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDue1,
      isOverdue: false,
      assigneeId: dev4.id,
    },
  ];

  const createdTasks: any[] = [];
  for (const tData of tasksData) {
    const task = await prisma.task.create({ data: tData });
    createdTasks.push(task);
  }

  console.log(`✅ Tasks created: ${createdTasks.length} tasks (including 2 overdue tasks)`);

  // 4. Seed Pre-existing Activity Logs
  console.log('📜 Generating pre-existing activity logs...');

  await prisma.activityLog.createMany({
    data: [
      {
        projectId: project1.id,
        taskId: createdTasks[0].id,
        actorId: dev1.id,
        action: 'TASK_STATUS_CHANGED',
        previousStatus: TaskStatus.IN_REVIEW,
        newStatus: TaskStatus.COMPLETED,
        message: 'Divya Dev moved Task #Setup PostgreSQL Database Schema & Prisma ORM from IN_REVIEW → COMPLETED',
        createdAt: new Date(now.getTime() - 3 * 3600 * 1000),
      },
      {
        projectId: project1.id,
        taskId: createdTasks[3].id,
        actorId: dev1.id,
        action: 'TASK_STATUS_CHANGED',
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message: 'Divya Dev moved Task #Build Shopping Cart & Checkout React Components from IN_PROGRESS → IN_REVIEW',
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
      {
        projectId: project2.id,
        taskId: createdTasks[6].id,
        actorId: dev3.id,
        action: 'TASK_STATUS_CHANGED',
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message: 'Chen Dev moved Task #Design Biometric Authentication Flow from IN_PROGRESS → IN_REVIEW',
        createdAt: new Date(now.getTime() - 1 * 3600 * 1000),
      },
      {
        projectId: project3.id,
        taskId: createdTasks[12].id,
        actorId: dev4.id,
        action: 'TASK_STATUS_CHANGED',
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message: 'Elena Dev moved Task #Automate GitHub Actions Deployment Pipeline from IN_PROGRESS → IN_REVIEW',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Pre-existing activity logs created');

  // 5. Seed Pre-existing Notifications
  console.log('🔔 Generating sample notifications...');

  await prisma.notification.createMany({
    data: [
      {
        recipientId: dev1.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: 'Ravi Manager assigned you to task: "Implement Payment Gateway Webhook Handlers"',
        isRead: false,
        taskId: createdTasks[1].id,
        createdAt: new Date(now.getTime() - 4 * 3600 * 1000),
      },
      {
        recipientId: pm1.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Moved to In Review',
        message: 'Divya Dev moved "Build Shopping Cart & Checkout React Components" to IN_REVIEW',
        isRead: false,
        taskId: createdTasks[3].id,
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
      {
        recipientId: dev2.id,
        type: NotificationType.TASK_OVERDUE,
        title: 'Task Overdue Notice',
        message: 'Task "Configure Push Notifications via Firebase Cloud Messaging" is past due date',
        isRead: true,
        taskId: createdTasks[5].id,
        createdAt: new Date(now.getTime() - 1 * 3600 * 1000),
      },
    ],
  });

  console.log('✅ Sample notifications created');

  console.log('🎉 Complete seeding finished successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 ASSESSMENT TEST LOGINS (Password: Password123!):');
  console.log('   Admin:             admin@agency.com');
  console.log('   Project Manager 1: pm1@agency.com');
  console.log('   Project Manager 2: pm2@agency.com');
  console.log('   Developer 1:       dev1@agency.com');
  console.log('   Developer 2:       dev2@agency.com');
  console.log('   Developer 3:       dev3@agency.com');
  console.log('   Developer 4:       dev4@agency.com');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_IN_REVIEW' | 'TASK_OVERDUE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner?: { id: string; name: string; email: string };
  tasks?: Task[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  project?: { id: string; title: string; ownerId: string };
  activityLogs?: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId?: string | null;
  actorId: string;
  actor: { id: string; name: string; email: string; role: Role };
  action: string;
  previousStatus?: TaskStatus | null;
  newStatus?: TaskStatus | null;
  message: string;
  createdAt: string;
  project?: { id: string; title: string };
  task?: { id: string; title: string; status: TaskStatus };
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  taskId?: string | null;
  task?: { id: string; title: string; status: TaskStatus; projectId: string };
  createdAt: string;
}

export interface DashboardStats {
  role: Role;
  totalUsers?: number;
  totalProjects?: number;
  totalTasks?: number;
  myProjectsCount?: number;
  overdueCount?: number;
  liveOnlineUserCount?: number;
  completedCount?: number;
  inProgressCount?: number;
  inReviewCount?: number;
  statusSummary?: Record<string, number>;
  prioritySummary?: Record<string, number>;
  upcomingTasks?: Task[];
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardStats } from '../types';
import { ActivityFeed } from '../components/common/ActivityFeed';
import { TaskCard } from '../components/common/TaskCard';
import api from '../services/api';
import {
  Users,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Plus,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { CreateProjectModal } from '../components/common/CreateProjectModal';
import { CreateTaskModal } from '../components/common/CreateTaskModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading role dashboard...</span>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-100">
              Welcome back, <span className="text-cyan-400">{user?.name}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin && 'Global System Dashboard — Full project, task & user management oversight.'}
            {user?.role === 'PROJECT_MANAGER' && 'Project Manager Workspace — Managing your project team and deliverables.'}
            {user?.role === 'DEVELOPER' && 'Developer Workbench — Strictly assigned task queue & live status updates.'}
          </p>
        </div>

        {/* Action Buttons: Only Project Managers can create projects & assign tasks */}
        <div className="flex items-center space-x-3">
          {user?.role === 'PROJECT_MANAGER' && (
            <>
              <button
                onClick={() => setIsProjModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Users</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats?.totalUsers || 0}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Projects</span>
                <FolderKanban className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats?.totalProjects || 0}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Tasks</span>
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats?.totalTasks || 0}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-rose-500/30 bg-rose-950/10 shadow-lg">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-xs font-semibold">Overdue Tasks</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">{stats?.overdueCount || 0}</div>
            </div>
          </>
        ) : user?.role === 'PROJECT_MANAGER' ? (
          <>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">My Projects</span>
                <FolderKanban className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats?.myProjectsCount || 0}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Project Tasks</span>
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats?.totalTasks || 0}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/30 bg-amber-950/10 shadow-lg">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-xs font-semibold">In Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {stats?.statusSummary?.IN_REVIEW || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-rose-500/30 bg-rose-950/10 shadow-lg">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-xs font-semibold">Overdue Tasks</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">{stats?.overdueCount || 0}</div>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Assigned Tasks</span>
                <CheckSquare className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats?.totalTasks || 0}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-blue-500/30 bg-blue-950/10 shadow-lg">
              <div className="flex items-center justify-between text-blue-400 mb-2">
                <span className="text-xs font-semibold">In Progress</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400">{stats?.inProgressCount || 0}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/30 bg-emerald-950/10 shadow-lg">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-semibold">Completed</span>
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {stats?.completedCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-rose-500/30 bg-rose-950/10 shadow-lg">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-xs font-semibold">Overdue Tasks</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">{stats?.overdueCount || 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid: Tasks & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Tasks List */}
        <div className={user?.role === 'PROJECT_MANAGER' ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-base">
              {user?.role === 'DEVELOPER'
                ? 'My Upcoming Deliverables'
                : 'Priority Tasks Across Projects'}
            </h3>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>View all tasks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className={`grid grid-cols-1 ${user?.role !== 'PROJECT_MANAGER' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-4`}>
            {stats?.upcomingTasks?.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800 col-span-full">
                No active upcoming tasks.
              </div>
            ) : (
              stats?.upcomingTasks?.map((task) => (
                <TaskCard key={task.id} task={task} onTaskUpdated={fetchStats} />
              ))
            )}
          </div>
        </div>

        {/* Live Activity Stream (Only displayed on Project Manager Dashboard; dedicated page available via Sidebar for all roles) */}
        {user?.role === 'PROJECT_MANAGER' && (
          <div className="lg:col-span-5">
            <ActivityFeed title="Live Team Activity Stream" />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isProjModalOpen}
        onClose={() => setIsProjModalOpen(false)}
        onSuccess={fetchStats}
      />
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
};

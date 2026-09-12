import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, TaskPriority, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TaskCard } from '../components/common/TaskCard';
import { CreateTaskModal } from '../components/common/CreateTaskModal';
import { CheckSquare, Filter, Plus, AlertTriangle, RotateCcw } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Read filter state directly from URL search params for shareability
  const statusFilter = searchParams.get('status') || '';
  const priorityFilter = searchParams.get('priority') || '';
  const overdueOnlyFilter = searchParams.get('overdueOnly') || '';

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (overdueOnlyFilter) params.overdueOnly = overdueOnlyFilter;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Tasks Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.role === 'ADMIN' && 'Global task oversight across all client projects.'}
            {user?.role === 'PROJECT_MANAGER' && 'Tasks belonging to your managed projects.'}
            {user?.role === 'DEVELOPER' && 'Strictly tasks assigned to your developer profile.'}
          </p>
        </div>

        {/* Task creation is restricted strictly to Project Managers */}
        {user?.role === 'PROJECT_MANAGER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Task</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar (Reflected in URL Query Parameters) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filter Tasks:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="IN_REVIEW">IN REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          {/* Overdue Only Filter */}
          <button
            onClick={() => updateFilter('overdueOnly', overdueOnlyFilter === 'true' ? '' : 'true')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              overdueOnlyFilter === 'true'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue Only</span>
          </button>
        </div>

        {(statusFilter || priorityFilter || overdueOnlyFilter) && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Task Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Filtering tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          No tasks match the active filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onTaskUpdated={fetchTasks} />
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />
    </div>
  );
};

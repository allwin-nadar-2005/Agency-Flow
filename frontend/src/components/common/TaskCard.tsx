import React from 'react';
import { Task, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { AlertTriangle, Calendar, User as UserIcon } from 'lucide-react';
import api from '../../services/api';

interface TaskCardProps {
  task: Task;
  onTaskUpdated?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdated }) => {
  const { user } = useAuth();

  // ONLY the assigned DEVELOPER can update task status
  const canUpdateStatus = user?.role === 'DEVELOPER' && task.assigneeId === user?.id;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'IN_PROGRESS':
        return 'bg-blue-950/80 text-blue-400 border-blue-800';
      case 'IN_REVIEW':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'COMPLETED':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-slate-900/80 border transition-all hover:shadow-xl ${
        task.isOverdue
          ? 'border-rose-500/40 shadow-rose-950/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border ${getPriorityBadge(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
          {task.isOverdue && (
            <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>OVERDUE</span>
            </span>
          )}
        </div>

        {/* Status Dropdown (Developers only) vs Read-only Badge (Admin & PMs) */}
        {canUpdateStatus ? (
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer outline-none transition-all ${getStatusColor(
              task.status
            )}`}
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="IN_REVIEW">IN REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        ) : (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getStatusColor(
              task.status
            )}`}
          >
            {task.status.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Task Title & Description */}
      <h4 className="font-bold text-slate-100 text-sm mb-1.5 line-clamp-2">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Project & Assignee Context */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>{task.assignee?.name || 'Unassigned'}</span>
        </div>

        <div className="flex items-center space-x-1 text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{format(new Date(task.dueDate), 'MMM d')}</span>
        </div>
      </div>
    </div>
  );
};

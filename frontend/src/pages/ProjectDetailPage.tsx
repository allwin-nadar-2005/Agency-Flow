import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Project, Task, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TaskCard } from '../components/common/TaskCard';
import { CreateTaskModal } from '../components/common/CreateTaskModal';
import { FolderKanban, Plus, User as UserIcon, CheckSquare, Clock } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchProjectDetail = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Access denied or project not found.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProjectDetail();
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading project details...</div>;
  }

  if (error || !project) {
    return (
      <div className="p-12 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
        <h3 className="font-bold text-lg mb-2">Project Access Error</h3>
        <p className="text-xs text-rose-300">{error || 'Unable to access project details.'}</p>
      </div>
    );
  }

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    TODO: project.tasks?.filter((t) => t.status === 'TODO') || [],
    IN_PROGRESS: project.tasks?.filter((t) => t.status === 'IN_PROGRESS') || [],
    IN_REVIEW: project.tasks?.filter((t) => t.status === 'IN_REVIEW') || [],
    COMPLETED: project.tasks?.filter((t) => t.status === 'COMPLETED') || [],
  };

  const columns: { key: TaskStatus; label: string; color: string }[] = [
    { key: 'TODO', label: 'To Do', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/30 bg-blue-950/20 text-blue-400' },
    { key: 'IN_REVIEW', label: 'In Review', color: 'border-amber-500/30 bg-amber-950/20 text-amber-400' },
    { key: 'COMPLETED', label: 'Completed', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Project Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100">{project.title}</h1>
              {project.description && (
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  {project.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-3 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Owner: {project.owner?.name}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>{project.tasks?.length || 0} Total Tasks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Only Project Managers can create and assign tasks */}
          {user?.role === 'PROJECT_MANAGER' && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map((col) => (
          <div
            key={col.key}
            className={`p-4 rounded-2xl border flex flex-col ${col.color} min-h-[500px]`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm tracking-wide">{col.label}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                {tasksByStatus[col.key].length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {tasksByStatus[col.key].length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl">
                  No tasks in {col.label}
                </div>
              ) : (
                tasksByStatus[col.key].map((t) => (
                  <TaskCard key={t.id} task={t} onTaskUpdated={fetchProjectDetail} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={fetchProjectDetail}
        defaultProjectId={project.id}
      />
    </div>
  );
};

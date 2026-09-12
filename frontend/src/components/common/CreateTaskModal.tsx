import React, { useEffect, useState } from 'react';
import { X, CheckSquare, Calendar } from 'lucide-react';
import { Project, User, TaskPriority } from '../../types';
import api from '../../services/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);

  // Default due date to 7 days in the future (YYYY-MM-DD)
  const defaultDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState(defaultDateStr);
  const [assigneeId, setAssigneeId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultProjectId) setProjectId(defaultProjectId);
      setDueDate(defaultDateStr);
      fetchFormData();
    }
  }, [isOpen, defaultProjectId]);

  const fetchFormData = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
      ]);
      setProjects(projRes.data.data);
      const devs = usersRes.data.data.filter((u: User) => u.role === 'DEVELOPER');
      setDevelopers(devs);
      if (!projectId && projRes.data.data.length > 0) {
        setProjectId(projRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch modal form data:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !dueDate) {
      setError('Please fill in all required fields (Project, Title, and Due Date).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new Error('Invalid Due Date selected');
      }

      await api.post('/tasks', {
        projectId,
        title,
        description,
        priority,
        dueDate: parsedDueDate.toISOString(),
        assigneeId: assigneeId || null,
      });

      setTitle('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">Create & Assign Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Project *
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement login functionality"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed task requirements..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Due Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  style={{ colorScheme: 'dark' }}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onFocus={(e) => e.currentTarget.showPicker?.()}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Assign to Developer
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="">Unassigned</option>
              {developers.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.name} ({dev.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create & Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FolderKanban, Plus, Calendar, User as UserIcon, CheckSquare, ChevronRight } from 'lucide-react';
import { CreateProjectModal } from '../components/common/CreateProjectModal';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Projects Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.role === 'ADMIN' && 'Full access: View and manage all agency projects across all teams.'}
            {user?.role === 'PROJECT_MANAGER' && 'Project Manager Workspace: Projects created and managed by you.'}
            {user?.role === 'DEVELOPER' && 'Developer Workbench: Projects containing tasks assigned to you.'}
          </p>
        </div>

        {/* Project creation is restricted strictly to Project Managers */}
        {user?.role === 'PROJECT_MANAGER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          No projects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              to={`/projects/${proj.id}`}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all hover:shadow-xl group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{proj._count?.tasks || 0} tasks</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-base mb-2 group-hover:text-cyan-400 transition-colors">
                  {proj.title}
                </h3>
                {proj.description && (
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {proj.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Owner: {proj.owner?.name || 'Manager'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
      />
    </div>
  );
};

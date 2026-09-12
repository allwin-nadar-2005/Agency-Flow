import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Activity,
  Users,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Activity Feed', path: '/activity', icon: Activity },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'User Management', path: '/admin/users', icon: Users });
  }

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 flex flex-col justify-between p-4 hidden md:flex min-h-[calc(100vh-4rem)]">
      <nav className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Role Scoping Footnote */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs">
        <div className="text-slate-400 font-semibold mb-1">Role Scoping Active</div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {user?.role === 'ADMIN' && 'Global visibility: All projects, tasks & activity logs.'}
          {user?.role === 'PROJECT_MANAGER' && 'Owner isolated: Managed projects & assigned team tasks.'}
          {user?.role === 'DEVELOPER' && 'Task isolated: Strictly assigned tasks & project context.'}
        </p>
      </div>
    </aside>
  );
};

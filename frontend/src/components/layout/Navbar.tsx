import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { LogOut, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUserCount } = useSocket();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'PROJECT_MANAGER':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'DEVELOPER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Connection Status */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
            AF
          </div>
          <span className="font-extrabold text-lg text-slate-100 tracking-tight">
            Agency<span className="text-cyan-400">Flow</span>
          </span>
        </Link>

        {/* Real-time Status Indicator */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="text-slate-400 font-medium">
            {isConnected ? 'Real-time Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Admin Live Online Users Badge */}
        {user?.role === 'ADMIN' && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs text-cyan-300 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>{onlineUserCount} Users Online</span>
          </div>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* User Pill Badge */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{user?.name}</div>
            <div className="text-[10px] text-slate-500">{user?.email}</div>
          </div>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-md border ${getRoleBadgeColor(
              user?.role || ''
            )}`}
          >
            {user?.role}
          </span>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

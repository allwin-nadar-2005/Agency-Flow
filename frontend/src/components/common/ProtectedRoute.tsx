import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mb-4 text-2xl">
          ⛔
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Denied (403 Forbidden)</h1>
        <p className="text-slate-400 max-w-md mb-6">
          Your role <span className="text-cyan-400 font-semibold">{user.role}</span> does not have authorization to view this page.
        </p>
        <a
          href="/"
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-600/20 transition-all"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

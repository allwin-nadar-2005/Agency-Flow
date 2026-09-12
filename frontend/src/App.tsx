import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TasksPage } from './pages/TasksPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { ActivityFeed } from './components/common/ActivityFeed';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Role-Scoped Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectDetailPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TasksPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div>
                          <h1 className="text-2xl font-black text-slate-100">Live Activity Feed</h1>
                          <p className="text-xs text-slate-400 mt-1">
                            Real-time transaction log of status changes and task updates.
                          </p>
                        </div>
                        <ActivityFeed showCatchupButton={true} />
                      </div>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Only Route */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <AdminUsersPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

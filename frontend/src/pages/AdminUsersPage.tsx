import React, { useEffect, useState } from 'react';
import { User, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, Plus, CheckCircle2, Copy, X, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<Role>('PROJECT_MANAGER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Created Credentials Confirmation Modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: Role;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/users', {
        name,
        email,
        password,
        role,
      });

      const result = res.data.data;
      setCreatedCredentials({
        name: result.user.name,
        email: result.credentials.email,
        password: result.credentials.temporaryPassword,
        role: result.credentials.role,
      });

      setName('');
      setEmail('');
      setPassword('Password123!');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error?.message || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!createdCredentials) return;
    const text = `AgencyFlow Login Credentials:\nRole: ${createdCredentials.role}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100">User Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create user accounts (Project Managers & Developers) and provision credentials.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create User Account</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading user accounts...</div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-100 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 font-bold flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setUserToDelete(u);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs rounded-xl border border-rose-500/30 transition-all ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete User</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100 text-base">Confirm Deletion</h3>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {deleteError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {deleteError}
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete user account <strong className="text-slate-100">{userToDelete.name}</strong> (<span className="text-slate-400">{userToDelete.email}</span>)?
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• <span className="text-slate-300">Role:</span> {userToDelete.role}</div>
                <div>• <span className="text-rose-400 font-semibold">Warning:</span> All associated task assignments and ownership records will be removed. This action cannot be undone.</div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100 text-base">Create User Account</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Manager"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@agency.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                >
                  <option value="PROJECT_MANAGER">PROJECT MANAGER</option>
                  <option value="DEVELOPER">DEVELOPER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Initial Password *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provisioned Credentials Output Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-6 h-6" />
              <span>Account Provisioned Successfully!</span>
            </div>

            <p className="text-xs text-slate-300">
              User account for <strong>{createdCredentials.name}</strong> has been created. Provide the following login credentials to the user:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div><span className="text-slate-500">Role:</span> <span className="text-cyan-400">{createdCredentials.role}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="text-slate-200">{createdCredentials.email}</span></div>
              <div><span className="text-slate-500">Password:</span> <span className="text-emerald-400">{createdCredentials.password}</span></div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={copyCredentialsToClipboard}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 rounded-xl border border-slate-700 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>

              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

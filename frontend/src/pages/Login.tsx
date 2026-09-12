import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login(demoEmail, 'Password123!');
      navigate('/');
    } catch (err: any) {
      setError('Quick login failed. Ensure database seed script has been run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10">
        {/* Brand Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-xl shadow-cyan-500/20 mb-3">
            AF
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Agency<span className="text-cyan-400">Flow</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-Time Client Project Dashboard</p>
        </div>

        {error && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@agency.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Assessment Role Switcher */}
        <div className="pt-6 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400 mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Assessment Evaluation Quick-Logins:</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              onClick={() => quickLogin('admin@agency.com')}
              className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-left font-medium transition-all flex items-center justify-between"
            >
              <span>👑 Admin (Amara)</span>
              <span className="text-[10px] text-purple-400">admin@agency.com</span>
            </button>
            <button
              onClick={() => quickLogin('pm1@agency.com')}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-left font-medium transition-all flex items-center justify-between"
            >
              <span>📁 PM 1 (Ravi - E-Commerce & Mobile)</span>
              <span className="text-[10px] text-cyan-400">pm1@agency.com</span>
            </button>
            <button
              onClick={() => quickLogin('pm2@agency.com')}
              className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-left font-medium transition-all flex items-center justify-between"
            >
              <span>📁 PM 2 (Sarah - Cloud Infra)</span>
              <span className="text-[10px] text-indigo-400">pm2@agency.com</span>
            </button>
            <button
              onClick={() => quickLogin('dev1@agency.com')}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-left font-medium transition-all flex items-center justify-between"
            >
              <span>💻 Developer 1 (Divya)</span>
              <span className="text-[10px] text-emerald-400">dev1@agency.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

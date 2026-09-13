import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User, Building, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login, demoLogin, registerOrganizer } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name or organizer name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await registerOrganizer({
          name: name.trim(),
          email: email.trim(),
          password: password,
          organization: organization.trim(),
        });
      }
      navigate('/organizer/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(demoEmail);
      navigate('/organizer/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-brand-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">EventHive</h1>
          <p className="mt-2 text-sm text-slate-400">
            Host, Manage, and Track Campus & Tech Events with Ease
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Quick Demo Switcher */}
          <div className="mb-6 rounded-2xl bg-brand-500/10 border border-brand-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                Instant Demo Evaluation
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Click to log in immediately as an organizer with pre-seeded events & registrations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex.organizer@eventhive.com')}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-600/80 hover:bg-brand-600 px-3 py-2 text-xs font-bold text-white transition-all shadow-md shadow-brand-600/20"
              >
                <span>Alex Rivera</span>
                <span className="text-[10px] opacity-75">(Tech Lead)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('sarah.organizer@eventhive.com')}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition-all border border-slate-700"
              >
                <span>Sarah Chen</span>
                <span className="text-[10px] opacity-75">(Arts Host)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 border-b border-slate-800 pb-4 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`text-sm font-bold pb-1 transition-all ${
                mode === 'login'
                  ? 'text-brand-400 border-b-2 border-brand-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Organizer Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`text-sm font-bold pb-1 transition-all ${
                mode === 'register'
                  ? 'text-brand-400 border-b-2 border-brand-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register as Host
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs font-medium text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Organizer / Host Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Miller"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Organization / Student Chapter
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. IEEE Student Chapter"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@eventhive.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password {mode === 'register' && '(min 6 characters)'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 hover:from-brand-500 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Dashboard' : 'Create Host Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

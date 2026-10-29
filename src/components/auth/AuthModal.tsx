import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, CheckCircle2, Shield, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/format';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { isConfigured, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isConfigured) {
      setError('Supabase is not configured yet. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to enable live authentication.');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
        } else {
          setSuccess('Signed in successfully.');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const { error: signUpError } = await signUp(email, password, displayName);
        if (signUpError) {
          setError(signUpError);
        } else {
          setSuccess('Account created! If confirmation is enabled, check your email.');
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#050507]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-[#0B0B10] border border-[#1C1C28] rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <Shield className="w-4 h-4 text-[#00F5FF]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">JalRakshak Portal</h3>
              <p className="text-[10px] text-zinc-400">Citizen & Responder Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-[#1C1C28] bg-[#050507]/50">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
            className={cn(
              'py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2',
              mode === 'signin'
                ? 'border-[#00F5FF] text-white bg-[#8B5CF6]/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
            className={cn(
              'py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2',
              mode === 'signup'
                ? 'border-[#00F5FF] text-white bg-[#8B5CF6]/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Citizen
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isConfigured && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-semibold block">Local Demo Mode</span>
                The backend is not connected. Add your Supabase credentials to <code className="text-[11px] bg-black/40 px-1 py-0.5 rounded">.env</code> to activate live user accounts.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2.5 items-start">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#050507] border border-[#1C1C28] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="citizen@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#050507] border border-[#1C1C28] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#050507] border border-[#1C1C28] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>
            {mode === 'signup' && (
              <p className="text-[10px] text-zinc-500 mt-1">Minimum 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Citizen Account
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="p-3 bg-[#050507]/40 border-t border-[#1C1C28] text-center">
          <p className="text-[10px] text-zinc-500">
            {mode === 'signin' ? "Don't have an account yet? " : 'Already registered? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setSuccess(null);
              }}
              className="text-[#00F5FF] hover:underline font-semibold"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

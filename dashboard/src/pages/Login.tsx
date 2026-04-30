import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Shield, Fingerprint, Loader2, KeyRound } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, '');
    if (useAuthStore.getState().isAuthenticated) navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">Prove your identity with zero-knowledge</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface-2 p-8 shadow-xl">
          {/* ZKP badge */}
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            <KeyRound className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-text-secondary">
              Login uses <strong className="text-text">Schnorr ZKP</strong> — no password needed
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
              <button onClick={clearError} className="float-right font-bold">×</button>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          {/* NO PASSWORD FIELD — ZKP auth */}

          <button type="submit" disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Proving...</> : <><Fingerprint className="h-4 w-4" /> Sign In with ZKP</>}
          </button>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:text-primary-light transition-colors">
              Create free account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

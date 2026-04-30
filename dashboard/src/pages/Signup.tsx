import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Shield, Fingerprint, Loader2, KeyRound } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ full_name: '', email: '', organization_name: '' });
  const { signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup({ ...form, password: '' });
    if (useAuthStore.getState().isAuthenticated) navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-text">Create Account</h1>
          <p className="mt-1 text-sm text-text-secondary">Zero-knowledge authentication — no password needed</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface-2 p-8 shadow-xl space-y-4">
          {/* ZKP badge */}
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            <KeyRound className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-text-secondary">
              A <strong className="text-text">secp256k1 key pair</strong> secures your account — no password
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
              <button onClick={clearError} className="float-right font-bold">×</button>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Full Name</label>
            <input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required placeholder="Jane Doe"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Work Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Organization</label>
            <input type="text" value={form.organization_name} onChange={(e) => set('organization_name', e.target.value)} required placeholder="Acme Corp"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          {/* NO PASSWORD FIELD — ZKP auth */}

          <button type="submit" disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating keys...</> : <><Fingerprint className="h-4 w-4" /> Create Account with ZKP</>}
          </button>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-light transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

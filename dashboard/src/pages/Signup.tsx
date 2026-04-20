import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Shield } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', organization_name: '' });
  const { signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(form);
    if (useAuthStore.getState().isAuthenticated) navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-text">Create your account</h1>
          <p className="mt-1 text-sm text-text-secondary">Start with 1,000 free proofs per month</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface-2 p-8 shadow-xl">
          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
              <button onClick={clearError} className="float-right font-bold">×</button>
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Full Name</label>
            <input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required placeholder="Jane Doe"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Work Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Organization Name</label>
            <input type="text" value={form.organization_name} onChange={(e) => set('organization_name', e.target.value)} required placeholder="Acme Corp"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Password</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} placeholder="Minimum 8 characters"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 transition-all duration-200">
            {isLoading ? 'Creating account…' : 'Create Free Account'}
          </button>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-light transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

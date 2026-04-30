import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Fingerprint, Clock, Zap, Key, BookOpen, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../components/StatsCard';
import { authAPI, usageAPI, zkpAPI } from '../api/services';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chart data will be populated from real analytics API once usage begins
  const [chartData] = useState<{day: string; proofs: number; verifications: number}[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, healthRes] = await Promise.allSettled([
          authAPI.me(),
          zkpAPI.healthCheck(),
        ]);

        if (meRes.status === 'fulfilled') setUser(meRes.value.data);
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const orgName = user?.org_name || 'Your Organization';
  const plan = user?.plan || 'free';

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ''} — here&apos;s your overview
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-light uppercase tracking-wider">
          {plan} Plan
        </span>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Health Status */}
      {health && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-surface-2 px-4 py-3">
          <span className={`h-2 w-2 rounded-full ${health.status === 'healthy' ? 'bg-success' : 'bg-danger'}`} />
          <span className="text-sm text-text">
            API Status: <strong className="text-success">{health.status}</strong>
          </span>
          <span className="text-xs text-text-muted">v{health.version}</span>
          {health.checks && (
            <div className="flex gap-3 ml-auto text-xs text-text-muted">
              {Object.entries(health.checks).map(([key, val]) => (
                <span key={key}>{key}: <span className={val === 'ok' ? 'text-success' : 'text-danger'}>{String(val)}</span></span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={Fingerprint} label="Today's Proofs" value="—" change="Connect to see" changeType="neutral" color="primary" />
        <StatsCard icon={ShieldCheck} label="Today's Verifications" value="—" change="Connect to see" changeType="neutral" color="success" />
        <StatsCard icon={Zap} label="Plan" value={plan.toUpperCase()} change={orgName} changeType="neutral" color="warning" />
        <StatsCard icon={Clock} label="Avg Latency" value="<5ms" change="Schnorr proofs" changeType="up" color="accent" />
      </div>

      {/* Chart */}
      <div className="mb-8 rounded-xl border border-border bg-surface-2 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Proof & Verification Volume</h2>
        {chartData.length > 0 ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="proofs" stroke="#6366f1" strokeWidth={2} dot={false} name="Proofs Created" />
              <Line type="monotone" dataKey="verifications" stroke="#10b981" strokeWidth={2} dot={false} name="Verifications" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        ) : (
        <div className="flex h-48 items-center justify-center text-center">
          <div>
            <Fingerprint className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">No usage data yet</p>
            <p className="text-xs text-text-muted mt-1">Create proofs via the API or Playground to see real-time analytics</p>
          </div>
        </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-2 p-6">
          <h2 className="mb-4 text-lg font-semibold text-text">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { to: '/dashboard/keys', icon: Key, label: 'Create API Key', desc: 'Generate a new key' },
              { to: '/dashboard/quickstart', icon: BookOpen, label: 'View Docs', desc: 'Integration guide' },
              { to: '/dashboard/playground', icon: Zap, label: 'Try Playground', desc: 'Test proofs live' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to}
                className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 hover:border-primary/30 hover:bg-surface-3 transition-all duration-150">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{label}</p>
                  <p className="text-xs text-text-muted">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Organization Info */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h2 className="mb-4 text-lg font-semibold text-text">Organization</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Name</span>
              <span className="text-text font-medium">{orgName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Plan</span>
              <span className="text-primary font-medium capitalize">{plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Role</span>
              <span className="text-text">{user?.role || '—'}</span>
            </div>
            <Link to="/dashboard/billing"
              className="block w-full mt-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary/10 transition-all">
              <ArrowUpRight className="inline h-4 w-4 mr-1" /> Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

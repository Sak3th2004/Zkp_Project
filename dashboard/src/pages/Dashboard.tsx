import { Link } from 'react-router-dom';
import { ShieldCheck, Fingerprint, Clock, Zap, Key, BookOpen, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../components/StatsCard';

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  proofs: Math.floor(Math.random() * 500 + 200),
  verifications: Math.floor(Math.random() * 1200 + 400),
}));

const recentActivity = [
  { op: 'proof_verify', status: 'success', key: 'sk_live_a1b2…', latency: '3.2ms', time: '2 min ago' },
  { op: 'key_generate', status: 'success', key: 'sk_live_a1b2…', latency: '12.4ms', time: '5 min ago' },
  { op: 'proof_create', status: 'success', key: 'sk_test_x9y8…', latency: '8.1ms', time: '8 min ago' },
  { op: 'auth_respond', status: 'failure', key: 'sk_live_a1b2…', latency: '6.7ms', time: '12 min ago' },
  { op: 'proof_verify', status: 'success', key: 'sk_live_a1b2…', latency: '2.9ms', time: '15 min ago' },
];

export default function Dashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">Welcome back — here's your overview</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-light uppercase tracking-wider">
          Free Plan
        </span>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={Fingerprint} label="Today's Proofs" value="1,247" change="+12.5%" changeType="up" color="primary" />
        <StatsCard icon={ShieldCheck} label="Today's Verifications" value="3,891" change="+8.3%" changeType="up" color="success" />
        <StatsCard icon={Zap} label="Monthly Usage" value="67%" change="670 / 1,000" changeType="neutral" color="warning" />
        <StatsCard icon={Clock} label="Avg Latency (p95)" value="4.2ms" change="-0.8ms" changeType="up" color="accent" />
      </div>

      {/* Chart */}
      <div className="mb-8 rounded-xl border border-border bg-surface-2 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Proof & Verification Volume</h2>
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
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-2 p-6">
          <h2 className="mb-4 text-lg font-semibold text-text">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${item.status === 'success' ? 'bg-success' : 'bg-danger'}`} />
                  <span className="text-sm font-medium text-text">{item.op}</span>
                  <span className="text-xs text-text-muted font-mono">{item.key}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-text-muted">{item.latency}</span>
                  <span className="text-xs text-text-muted">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h2 className="mb-4 text-lg font-semibold text-text">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { to: '/dashboard/keys', icon: Key, label: 'Create API Key', desc: 'Generate a new key' },
              { to: '/dashboard/quickstart', icon: BookOpen, label: 'View Docs', desc: 'Integration guide' },
              { to: '/dashboard/billing', icon: ArrowUpRight, label: 'Upgrade Plan', desc: 'Unlock more proofs' },
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
      </div>
    </div>
  );
}

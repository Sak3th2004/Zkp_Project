import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dailyData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`, creates: Math.floor(Math.random() * 800 + 100), verifies: Math.floor(Math.random() * 2000 + 300),
}));
const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, calls: Math.floor(Math.random() * 300 + 50) }));
const pieData = [
  { name: 'Proof Create', value: 35, color: '#6366f1' },
  { name: 'Proof Verify', value: 50, color: '#10b981' },
  { name: 'Auth Flow', value: 15, color: '#06b6d4' },
];
const latencyData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`, p50: Math.random() * 3 + 1, p95: Math.random() * 8 + 3,
}));

export default function Analytics() {
  const [range, setRange] = useState('30d');
  const ranges = ['7d', '30d', '90d'];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Usage & Analytics</h1>
          <p className="mt-1 text-sm text-text-secondary">Monitor your API usage and performance</p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {ranges.map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${range === r ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Usage Meter */}
      <div className="mb-6 rounded-xl border border-border bg-surface-2 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text">Monthly Usage — Proof Creates</h3>
          <span className="text-sm text-text-secondary">670 / 1,000</span>
        </div>
        <div className="h-3 rounded-full bg-surface overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: '67%' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h3 className="mb-4 text-sm font-semibold text-text">Daily Volume</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="creates" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="verifies" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h3 className="mb-4 text-sm font-semibold text-text">Hourly Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h3 className="mb-4 text-sm font-semibold text-text">Operations Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((e) => (<Cell key={e.name} fill={e.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h3 className="mb-4 text-sm font-semibold text-text">Latency (p50 / p95)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="ms" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="p50" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

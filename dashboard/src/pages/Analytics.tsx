import { useState } from 'react';
import { BarChart3 } from 'lucide-react';

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
          <span className="text-sm text-text-secondary">0 / 1,000</span>
        </div>
        <div className="h-3 rounded-full bg-surface overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: '0%' }} />
        </div>
        <p className="mt-2 text-xs text-text-muted">Usage resets on the 1st of each month</p>
      </div>

      {/* Empty state */}
      <div className="rounded-xl border border-border bg-surface-2 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">No usage data yet</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
          Analytics will appear here once you start making API calls. Create your first proof using the Playground or integrate the SDK into your app.
        </p>
        <div className="flex justify-center gap-3">
          <a href="/dashboard/playground" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
            Try the Playground
          </a>
          <a href="/dashboard/quickstart" className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-3 transition-colors">
            View Quick Start
          </a>
        </div>
      </div>
    </div>
  );
}

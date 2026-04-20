import { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

const logs = Array.from({ length: 20 }, (_, i) => ({
  id: `req_${Math.random().toString(36).slice(2, 10)}`,
  timestamp: new Date(Date.now() - i * 300000).toISOString(),
  operation: ['proof_create', 'proof_verify', 'key_generate', 'auth_challenge', 'auth_respond'][i % 5],
  status: i % 7 === 0 ? 'failure' : 'success',
  apiKey: i % 2 === 0 ? 'sk_live_a1b2…' : 'sk_test_x9y8…',
  latency: `${(Math.random() * 15 + 1).toFixed(1)}ms`,
  ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
}));

export default function AuditLogs() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.status === filter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Audit Logs</h1>
          <p className="mt-1 text-sm text-text-secondary">Complete history of API operations</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-3">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {['all', 'success', 'failure'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-3'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-text-muted w-8"></th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Operation</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">API Key</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Latency</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <>
                <tr key={log.id} onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="border-b border-border cursor-pointer hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 text-text-muted">
                    {expanded === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 text-text font-medium">{log.operation}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${log.status === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{log.apiKey}</td>
                  <td className="px-4 py-3 text-text-secondary">{log.latency}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{log.ip}</td>
                </tr>
                {expanded === log.id && (
                  <tr key={`${log.id}-detail`} className="border-b border-border">
                    <td colSpan={7} className="bg-surface px-6 py-4">
                      <pre className="text-xs text-text-secondary font-mono">{JSON.stringify({ request_id: log.id, operation: log.operation, status: log.status, latency: log.latency, ip: log.ip }, null, 2)}</pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

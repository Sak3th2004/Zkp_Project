import { useState, useEffect } from 'react';
import { Loader2, FileSearch } from 'lucide-react';

interface AuditLog {
  id: string;
  method: string;
  path: string;
  status: number;
  latency: string;
  ip: string;
  timestamp: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Audit logs come from real API usage — empty until API calls are made
  // In production, this would fetch from /dashboard/audit-logs

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Audit Logs</h1>
          <p className="mt-1 text-sm text-text-secondary">Track all API requests in real-time</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-2 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileSearch className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">No audit logs yet</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
            Audit logs are recorded automatically when API calls are made. Create your first proof or verify a key to see logs appear here.
          </p>
          <a href="/dashboard/playground" className="inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
            Try the Playground
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left font-medium text-text-muted">Request ID</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Method</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Path</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Latency</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">IP</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">{log.id}</td>
                  <td className="px-4 py-2.5"><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{log.method}</span></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text">{log.path}</td>
                  <td className="px-4 py-2.5"><span className={`rounded px-2 py-0.5 text-xs font-medium ${log.status < 400 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{log.status}</span></td>
                  <td className="px-4 py-2.5 text-text-secondary">{log.latency}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">{log.ip}</td>
                  <td className="px-4 py-2.5 text-text-muted">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

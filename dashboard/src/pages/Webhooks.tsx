import { useState } from 'react';
import { Plus, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';

const mockWebhooks = [
  { id: '1', url: 'https://example.com/webhook', events: ['proof.verified', 'proof.failed'], active: true, lastTriggered: '5 min ago', failures: 0 },
  { id: '2', url: 'https://api.myapp.com/zkp-events', events: ['proof.verified', 'usage.limit_reached'], active: true, lastTriggered: '1 hour ago', failures: 2 },
];

const allEvents = ['proof.created', 'proof.verified', 'proof.failed', 'auth.completed', 'auth.failed', 'batch.completed', 'usage.threshold_80', 'usage.threshold_100'];

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const toggleEvent = (e: string) => setSelectedEvents((p) => p.includes(e) ? p.filter((x) => x !== e) : [...p, e]);

  const addWebhook = () => {
    if (!newUrl || selectedEvents.length === 0) return;
    setWebhooks((p) => [...p, { id: String(Date.now()), url: newUrl, events: selectedEvents, active: true, lastTriggered: 'Never', failures: 0 }]);
    setShowAdd(false); setNewUrl(''); setSelectedEvents([]);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Webhooks</h1>
          <p className="mt-1 text-sm text-text-secondary">Get notified when events happen in your account</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Add Webhook
        </button>
      </div>

      <div className="space-y-4">
        {webhooks.map((wh) => (
          <div key={wh.id} className="rounded-xl border border-border bg-surface-2 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {wh.active ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-danger" />}
                  <code className="text-sm font-mono text-text">{wh.url}</code>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {wh.events.map((e) => (
                    <span key={e} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{e}</span>
                  ))}
                </div>
                <p className="text-xs text-text-muted">Last triggered: {wh.lastTriggered} · Failures: {wh.failures}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg p-2 text-text-muted hover:bg-surface-3 hover:text-accent" title="Test"><Send className="h-4 w-4" /></button>
                <button onClick={() => setWebhooks((p) => p.filter((w) => w.id !== wh.id))} className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-2 p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-text">Add Webhook</h2>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Endpoint URL</label>
              <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://your-app.com/webhook"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-text-secondary">Events</label>
              <div className="grid grid-cols-2 gap-2">
                {allEvents.map((e) => (
                  <button key={e} onClick={() => toggleEvent(e)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition-all ${selectedEvents.includes(e) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-3">Cancel</button>
              <button onClick={addWebhook} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">Add Webhook</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

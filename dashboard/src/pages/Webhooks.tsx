import { useState, useEffect } from 'react';
import { Plus, Webhook, Trash2, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../api/client';

interface WebhookEntry {
  id: string; url: string; events: string[]; active: boolean; created_at: string;
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['proof.created', 'proof.verified']);
  const [creating, setCreating] = useState(false);

  const allEvents = ['proof.created', 'proof.verified', 'auth.challenge', 'auth.verified', 'key.generated'];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard/webhooks');
        setWebhooks(Array.isArray(res.data) ? res.data : res.data.webhooks || []);
      } catch {
        setWebhooks([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post('/dashboard/webhooks', { url: newUrl, events: newEvents });
      setWebhooks(prev => [...prev, res.data]);
      setShowModal(false);
      setNewUrl('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create webhook — API not yet available');
    }
    setCreating(false);
  };

  const toggleEvent = (ev: string) => {
    setNewEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Webhooks</h1>
          <p className="mt-1 text-sm text-text-secondary">Get notified when events happen in your account</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> Add Webhook
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto font-bold">×</button>
        </div>
      )}

      {webhooks.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-2 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Webhook className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">No webhooks configured</h3>
          <p className="text-sm text-text-secondary mb-4">Set up webhooks to receive real-time notifications when proofs are created or verified.</p>
          <button onClick={() => setShowModal(true)}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
            Create Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4">
              <div>
                <p className="text-sm font-medium text-text font-mono">{wh.url}</p>
                <div className="mt-1 flex gap-2">
                  {wh.events.map(ev => (
                    <span key={ev} className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{ev}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${wh.active ? 'bg-success' : 'bg-surface-3'}`} />
                <button className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-2 p-8">
            <h2 className="mb-6 text-xl font-bold text-text">Add Webhook</h2>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Endpoint URL</label>
              <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://your-app.com/webhook"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Events</label>
              <div className="space-y-2">
                {allEvents.map(ev => (
                  <button key={ev} onClick={() => toggleEvent(ev)}
                    className={`flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-sm transition-all ${
                      newEvents.includes(ev) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/30'
                    }`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${newEvents.includes(ev) ? 'border-primary bg-primary' : 'border-border'}`}>
                      {newEvents.includes(ev) && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="font-mono text-xs">{ev}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-3">Cancel</button>
              <button onClick={handleCreate} disabled={!newUrl || creating}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

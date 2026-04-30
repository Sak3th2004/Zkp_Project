import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, RotateCcw, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { keysAPI } from '../api/services';

interface ApiKeyRow {
  id: string; name: string; prefix: string; type: 'live' | 'test'; created: string; lastUsed: string; active: boolean;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'live' | 'test'>('live');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await keysAPI.list();
      const data = res.data;
      const mapped = (Array.isArray(data) ? data : data.keys || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        prefix: k.key_prefix || k.prefix || 'sk_…',
        type: k.key_type || 'live',
        created: k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Unknown',
        lastUsed: k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never',
        active: k.is_active ?? true,
      }));
      setKeys(mapped);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load keys');
    }
    setLoading(false);
  };

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await keysAPI.create({ name: newKeyName, key_type: newKeyType });
      const data = res.data;
      setGeneratedKey(data.raw_key || data.key || `sk_${newKeyType}_${data.id?.slice(0, 24) || 'generated'}`);
      await loadKeys();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create key');
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    try {
      await keysAPI.revoke(id);
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to revoke key');
    }
  };

  const handleRotate = async (id: string) => {
    if (!confirm('Rotate this key? The old key will be revoked immediately.')) return;
    try {
      const res = await keysAPI.rotate(id);
      setGeneratedKey(res.data.raw_key || res.data.key);
      setShowModal(true);
      await loadKeys();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to rotate key');
    }
  };

  const handleCopy = () => {
    if (generatedKey) navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">API Keys</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your API keys for authentication</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadKeys} className="rounded-lg border border-border p-2.5 text-text-muted hover:text-text hover:bg-surface-3 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => { setShowModal(true); setGeneratedKey(null); setNewKeyName(''); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
            <Plus className="h-4 w-4" /> Create New Key
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto font-bold">×</button>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-2 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">No API keys yet</h3>
          <p className="text-sm text-text-secondary mb-4">Create your first API key to start integrating ZKProofAPI</p>
          <button onClick={() => { setShowModal(true); setGeneratedKey(null); setNewKeyName(''); }}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-6 py-3 text-left font-medium text-text-muted">Name</th>
                <th className="px-6 py-3 text-left font-medium text-text-muted">Key</th>
                <th className="px-6 py-3 text-left font-medium text-text-muted">Type</th>
                <th className="px-6 py-3 text-left font-medium text-text-muted">Created</th>
                <th className="px-6 py-3 text-left font-medium text-text-muted">Last Used</th>
                <th className="px-6 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-text">{k.name}</td>
                  <td className="px-6 py-4 font-mono text-text-secondary">{k.prefix}…</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${k.type === 'live' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {k.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{k.created}</td>
                  <td className="px-6 py-4 text-text-secondary">{k.lastUsed}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleRotate(k.id)} className="rounded-lg p-2 text-text-muted hover:bg-surface-3 hover:text-text" title="Rotate">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(k.id)} className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger" title="Revoke">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Key Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-2 p-8 shadow-2xl">
            {!generatedKey ? (
              <>
                <h2 className="mb-6 text-xl font-bold text-text">Create API Key</h2>
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Key Name</label>
                  <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Backend"
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="mb-6">
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Key Type</label>
                  <div className="flex gap-3">
                    {(['live', 'test'] as const).map((t) => (
                      <button key={t} onClick={() => setNewKeyType(t)}
                        className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${newKeyType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                        {t === 'live' ? '🔴 Live' : '🟡 Test'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-3">Cancel</button>
                  <button onClick={handleCreate} disabled={!newKeyName || creating}
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2">
                    {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create Key'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-xl font-bold text-text">Your API Key</h2>
                <p className="mb-4 text-sm text-warning">⚠️ Copy this key now. It won&apos;t be shown again.</p>
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-surface p-3">
                  <code className="flex-1 text-sm text-text break-all font-mono">{generatedKey}</code>
                  <button onClick={handleCopy} className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <button onClick={() => setShowModal(false)} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

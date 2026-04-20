import { useState } from 'react';
import { Plus, Copy, Trash2, RotateCcw, Check } from 'lucide-react';

interface ApiKeyRow {
  id: string; name: string; prefix: string; type: 'live' | 'test'; created: string; lastUsed: string; active: boolean;
}

const mockKeys: ApiKeyRow[] = [
  { id: '1', name: 'Production Backend', prefix: 'sk_live_a1b2', type: 'live', created: '2026-04-10', lastUsed: '2 min ago', active: true },
  { id: '2', name: 'Staging', prefix: 'sk_test_x9y8', type: 'test', created: '2026-04-12', lastUsed: '1 hour ago', active: true },
  { id: '3', name: 'Mobile App', prefix: 'sk_live_m3n4', type: 'live', created: '2026-04-15', lastUsed: 'Never', active: false },
];

export default function ApiKeys() {
  const [keys, setKeys] = useState(mockKeys);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'live' | 'test'>('live');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    const key = `sk_${newKeyType}_${Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`;
    setGeneratedKey(key);
    setKeys((prev) => [{ id: String(Date.now()), name: newKeyName, prefix: key.slice(0, 12), type: newKeyType, created: 'Just now', lastUsed: 'Never', active: true }, ...prev]);
  };

  const handleCopy = () => {
    if (generatedKey) navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleKey = (id: string) => setKeys((prev) => prev.map((k) => k.id === id ? { ...k, active: !k.active } : k));
  const deleteKey = (id: string) => setKeys((prev) => prev.filter((k) => k.id !== id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">API Keys</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your API keys for authentication</p>
        </div>
        <button onClick={() => { setShowModal(true); setGeneratedKey(null); setNewKeyName(''); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> Create New Key
        </button>
      </div>

      {/* Keys Table */}
      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-6 py-3 text-left font-medium text-text-muted">Name</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Key</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Type</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Created</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Last Used</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Status</th>
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
                <td className="px-6 py-4">
                  <button onClick={() => toggleKey(k.id)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${k.active ? 'bg-success' : 'bg-surface-3'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${k.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg p-2 text-text-muted hover:bg-surface-3 hover:text-text" title="Rotate"><RotateCcw className="h-4 w-4" /></button>
                    <button onClick={() => deleteKey(k.id)} className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger" title="Revoke"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <button onClick={handleCreate} disabled={!newKeyName} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">Create Key</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-xl font-bold text-text">Your API Key</h2>
                <p className="mb-4 text-sm text-warning">⚠️ Copy this key now. It won't be shown again.</p>
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

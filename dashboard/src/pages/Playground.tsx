import { useState } from 'react';
import { Loader2, Copy, Check, Play, Zap, Key, Shield, ArrowRight } from 'lucide-react';
import { zkpAPI } from '../api/services';

type Tab = 'generate' | 'prove' | 'verify';

export default function Playground() {
  const [tab, setTab] = useState<Tab>('generate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Stored state across tabs
  const [keyPair, setKeyPair] = useState<any>(null);
  const [proof, setProof] = useState<any>(null);
  const [message, setMessage] = useState('hello-zkp');

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await zkpAPI.generateKeys({ user_id: 'playground_user' });
      setKeyPair(res.data);
      setResult(res.data);
      setTab('prove');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || err.message);
    }
    setLoading(false);
  };

  const handleProve = async () => {
    if (!keyPair) { setError('Generate keys first!'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await zkpAPI.createProof({
        private_key: keyPair.private_key,
        public_key: keyPair.public_key?.compressed || keyPair.public_key,
        message,
        rounds: 1,
      });
      setProof(res.data);
      setResult(res.data);
      setTab('verify');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || err.message);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!proof || !keyPair) { setError('Create a proof first!'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await zkpAPI.verifyProof({
        proof: proof.proof,
        public_key: keyPair.public_key?.compressed || keyPair.public_key,
        message,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || err.message);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'generate' as Tab, label: '1. Generate Keys', icon: Key, action: handleGenerate, ready: true },
    { id: 'prove' as Tab, label: '2. Create Proof', icon: Zap, action: handleProve, ready: !!keyPair },
    { id: 'verify' as Tab, label: '3. Verify Proof', icon: Shield, action: handleVerify, ready: !!proof },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">API Playground</h1>
        <p className="mt-1 text-sm text-text-secondary">Test zero-knowledge proofs live — no code required</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-xl border border-border bg-surface-2 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.id ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'
            }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Request */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            {tab === 'generate' ? 'POST /v1/keys/generate' : tab === 'prove' ? 'POST /v1/proofs/create' : 'POST /v1/proofs/verify'}
          </h3>

          {/* Message input (for prove/verify) */}
          {(tab === 'prove' || tab === 'verify') && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Message (to bind proof to)</label>
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          {/* Status indicators */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full ${keyPair ? 'bg-success' : 'bg-surface-3'}`} />
              <span className={keyPair ? 'text-success' : 'text-text-muted'}>Keys {keyPair ? 'Generated ✓' : 'Not generated'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full ${proof ? 'bg-success' : 'bg-surface-3'}`} />
              <span className={proof ? 'text-success' : 'text-text-muted'}>Proof {proof ? 'Created ✓' : 'Not created'}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button onClick={tabs.find(t => t.id === tab)?.action} disabled={loading || !tabs.find(t => t.id === tab)?.ready}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition-all">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</> : <><Play className="h-4 w-4" /> Run {tab === 'generate' ? 'Generate' : tab === 'prove' ? 'Create Proof' : 'Verify'}</>}
          </button>

          {/* Flow guide */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
            <span className={keyPair ? 'text-success font-medium' : ''}>Generate</span>
            <ArrowRight className="h-3 w-3" />
            <span className={proof ? 'text-success font-medium' : ''}>Prove</span>
            <ArrowRight className="h-3 w-3" />
            <span className={result?.valid !== undefined ? 'text-success font-medium' : ''}>Verify</span>
          </div>
        </div>

        {/* Right: Response */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Response</h3>
            {result && (
              <button onClick={copyResult} className="rounded-md bg-surface p-1.5 text-text-muted hover:text-text">
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {result ? (
            <>
              {result.valid !== undefined && (
                <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${result.valid ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                  {result.valid ? '✅ Proof is VALID — Identity confirmed!' : '❌ Proof is INVALID — Verification failed'}
                </div>
              )}
              <pre className="rounded-xl bg-[#0d1117] border border-border px-4 py-3 overflow-auto max-h-96 text-xs text-[#c9d1d9] leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
              {result.latency_ms && (
                <p className="mt-3 text-xs text-text-muted">⚡ Completed in {result.latency_ms}ms</p>
              )}
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-text-muted">
              Run a request to see the response here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

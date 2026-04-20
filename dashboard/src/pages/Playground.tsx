import { useState } from 'react';
import { Send, Copy, Check } from 'lucide-react';

const endpoints = [
  { method: 'POST', path: '/v1/keys/generate', body: '{\n  "user_id": "user_123"\n}' },
  { method: 'POST', path: '/v1/proofs/create', body: '{\n  "private_key": "YOUR_PRIVATE_KEY_HEX",\n  "public_key": "YOUR_COMPRESSED_PUBLIC_KEY_HEX",\n  "message": "hello world",\n  "rounds": 1\n}' },
  { method: 'POST', path: '/v1/proofs/verify', body: '{\n  "proof": {\n    "commitment": {"x": "...", "y": "..."},\n    "challenge": "...",\n    "response": "..."\n  },\n  "public_key": "02...",\n  "message": "hello world"\n}' },
  { method: 'POST', path: '/v1/auth/challenge', body: '{\n  "public_key": "02...",\n  "session_id": "sess_abc",\n  "ttl_seconds": 60\n}' },
  { method: 'GET', path: '/v1/usage', body: '' },
  { method: 'GET', path: '/v1/health', body: '' },
];

export default function Playground() {
  const [selected, setSelected] = useState(0);
  const [body, setBody] = useState(endpoints[0].body);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelect = (i: number) => { setSelected(i); setBody(endpoints[i].body); setResponse(null); };

  const handleSend = async () => {
    setLoading(true);
    try {
      const ep = endpoints[selected];
      const opts: RequestInit = { method: ep.method, headers: { 'Content-Type': 'application/json', 'X-API-Key': 'sk_test_playground_demo' } };
      if (ep.method === 'POST' && body) opts.body = body;
      const res = await fetch(ep.path, opts);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(JSON.stringify({ error: err.message }, null, 2));
    }
    setLoading(false);
  };

  const curlCmd = `curl -X ${endpoints[selected].method} http://localhost:8000${endpoints[selected].path} \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: sk_test_YOUR_KEY"${endpoints[selected].body ? ` \\\n  -d '${endpoints[selected].body.replace(/\n/g, '')}'` : ''}`;

  const copyCode = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">API Playground</h1>
        <p className="mt-1 text-sm text-text-secondary">Test API endpoints interactively</p>
      </div>

      {/* Endpoint Selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {endpoints.map((ep, i) => (
          <button key={i} onClick={() => handleSelect(i)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${selected === i ? 'bg-primary/10 text-primary border border-primary/30' : 'border border-border text-text-secondary hover:bg-surface-3'}`}>
            <span className={`text-xs font-bold ${ep.method === 'GET' ? 'text-success' : 'text-warning'}`}>{ep.method}</span>
            <span className="font-mono text-xs">{ep.path}</span>
          </button>
        ))}
      </div>

      {/* Split Panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Request */}
        <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
            <span className="text-sm font-semibold text-text">Request</span>
            <button onClick={handleSend} disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
              <Send className="h-3.5 w-3.5" /> {loading ? 'Sending…' : 'Send'}
            </button>
          </div>
          {endpoints[selected].method === 'POST' ? (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12}
              className="w-full resize-none bg-surface-2 px-4 py-3 font-mono text-sm text-text focus:outline-none" />
          ) : (
            <div className="px-4 py-3 text-sm text-text-muted italic">No request body for GET endpoints</div>
          )}
        </div>

        {/* Response */}
        <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
            <span className="text-sm font-semibold text-text">Response</span>
          </div>
          <pre className="max-h-80 overflow-auto px-4 py-3 font-mono text-sm text-text">
            {response || '// Send a request to see the response'}
          </pre>
        </div>
      </div>

      {/* Copy as cURL */}
      <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text">Copy as cURL</span>
          <button onClick={() => copyCode(curlCmd)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text hover:bg-surface-3">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="overflow-x-auto font-mono text-xs text-text-secondary">{curlCmd}</pre>
      </div>
    </div>
  );
}

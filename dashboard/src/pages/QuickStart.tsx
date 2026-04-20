import { useState } from 'react';
import { CheckCircle, Circle, Copy, Check } from 'lucide-react';

const steps = [
  { title: 'Create Account', done: true },
  { title: 'Generate API Key', done: true },
  { title: 'Make First Proof', done: false },
  { title: 'Verify First Proof', done: false },
];

const snippets: Record<string, Record<string, string>> = {
  install: {
    JavaScript: 'npm install @zkproofapi/sdk',
    Python: 'pip install zkproofapi',
    cURL: '# No installation needed',
  },
  generate: {
    JavaScript: `import { ZKProofAPI } from '@zkproofapi/sdk';

const zkp = new ZKProofAPI('sk_live_YOUR_API_KEY');
const keyPair = await zkp.generateKeyPair({ userId: 'user_123' });
console.log(keyPair.publicKey);`,
    Python: `from zkproofapi import ZKProofAPI

zkp = ZKProofAPI(api_key="sk_live_YOUR_API_KEY")
key_pair = zkp.generate_key_pair(user_id="user_123")
print(key_pair.public_key)`,
    cURL: `curl -X POST https://api.zkproofapi.com/v1/keys/generate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_YOUR_API_KEY" \\
  -d '{"user_id": "user_123"}'`,
  },
  prove: {
    JavaScript: `const proof = await zkp.createProof({
  privateKey: keyPair.privateKey,
  publicKey: keyPair.publicKey,
  message: 'login:user_123',
});`,
    Python: `proof = zkp.create_proof(
    private_key=key_pair.private_key,
    public_key=key_pair.public_key,
    message="login:user_123"
)`,
    cURL: `curl -X POST https://api.zkproofapi.com/v1/proofs/create \\
  -H "X-API-Key: sk_live_YOUR_API_KEY" \\
  -d '{"private_key":"...","public_key":"...","message":"login:user_123"}'`,
  },
};

export default function QuickStart() {
  const [lang, setLang] = useState('JavaScript');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Quick Start Guide</h1>
        <p className="mt-1 text-sm text-text-secondary">Get up and running with ZKProofAPI in minutes</p>
      </div>

      {/* Progress */}
      <div className="mb-8 flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {s.done ? <CheckCircle className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
            <span className={`text-sm ${s.done ? 'text-success font-medium' : 'text-text-muted'}`}>{s.title}</span>
            {i < steps.length - 1 && <div className={`h-px w-8 ${s.done ? 'bg-success' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Language Tabs */}
      <div className="mb-6 flex rounded-lg border border-border overflow-hidden">
        {['JavaScript', 'Python', 'cURL'].map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${lang === l ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Steps */}
      {Object.entries(snippets).map(([key, langs]) => (
        <div key={key} className="mb-6 rounded-xl border border-border bg-surface-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <span className="text-sm font-semibold text-text capitalize">
              {key === 'install' ? '1. Install SDK' : key === 'generate' ? '2. Generate Key Pair' : '3. Create & Verify Proof'}
            </span>
            <button onClick={() => copy(key, langs[lang])} className="flex items-center gap-1 text-xs text-text-muted hover:text-text">
              {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === key ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto px-4 py-3 font-mono text-sm text-text-secondary">{langs[lang]}</pre>
        </div>
      ))}
    </div>
  );
}

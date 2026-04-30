"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Copy, Check, Book, Code, Key, Zap, Terminal, AlertTriangle, ArrowRight } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-3 right-3 rounded-md bg-surface-2/80 p-1.5 text-text-muted hover:text-text transition-all">
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <CopyButton text={code} />
      <pre className="rounded-xl bg-[#0d1117] border border-border px-5 py-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[#c9d1d9]">{code}</code>
      </pre>
    </div>
  );
}

const sections = [
  { id: "quickstart", label: "Quick Start", icon: Zap },
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "keys", label: "Key Generation", icon: Key },
  { id: "proofs", label: "Create & Verify Proofs", icon: Code },
  { id: "auth-flow", label: "Auth Challenge Flow", icon: Shield },
  { id: "js-sdk", label: "JavaScript SDK", icon: Terminal },
  { id: "python-sdk", label: "Python SDK", icon: Terminal },
  { id: "react-sdk", label: "React Hooks", icon: Code },
  { id: "errors", label: "Error Handling", icon: AlertTriangle },
  { id: "rate-limits", label: "Rate Limits", icon: Zap },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart");

  return (
    <div className="min-h-screen bg-surface font-sans flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-surface-2 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text">Docs</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-secondary hover:text-text hover:bg-surface"
              }`}>
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-12 space-y-16">

          {/* Quick Start */}
          <section id="quickstart">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-text">Quick Start</h1>
            </div>
            <p className="text-text-secondary mb-6 text-lg">Get zero-knowledge authentication running in under 5 minutes.</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">1. Install the SDK</h3>
                <CodeBlock code="npm install @zkproofapi/sdk" lang="bash" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">2. Generate Keys & Create Proof</h3>
                <CodeBlock code={`import { ZKProofAPI } from '@zkproofapi/sdk';

const zkp = new ZKProofAPI('YOUR_API_KEY_HERE');

// Generate a key pair (private key returned ONCE)
const keys = await zkp.generateKeyPair({ userId: 'user_123' });

// Create a zero-knowledge proof
const proof = await zkp.createProof({
  privateKey: keys.privateKey,
  publicKey: keys.publicKey.compressed,
  message: 'login:user_123',
});

// Verify the proof (server-side)
const result = await zkp.verifyProof({
  proof: proof.proof,
  publicKey: keys.publicKey.compressed,
  message: 'login:user_123',
});

console.log(result.valid); // true ✅`} />
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <h3 className="text-sm font-semibold text-primary mb-2">🔐 Security Note</h3>
                <p className="text-sm text-text-secondary">
                  The private key is returned <strong>only once</strong> during key generation and is never stored on our servers.
                  Store it securely on the user&apos;s device (encrypted localStorage, Keychain, etc.).
                </p>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication">
            <h2 className="text-2xl font-bold text-text mb-4">Authentication</h2>
            <p className="text-text-secondary mb-6">
              All API requests require an API key passed via the <code className="rounded bg-surface-2 px-2 py-0.5 text-primary text-sm">X-API-Key</code> header.
            </p>
            <CodeBlock code={`// Every request must include:
headers: {
  'X-API-Key': 'YOUR_API_KEY_HERE'
}

// API key format:
// Starts with "sk_" followed by mode (live/test)
// Example: sk_live_abc123... or sk_test_xyz789...`} />

            <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-yellow-400">⚠ Never expose API keys in client-side code.</strong> Use them only on your backend server.
                For browser usage, use the React SDK with a backend proxy.
              </p>
            </div>
          </section>

          {/* Key Generation */}
          <section id="keys">
            <h2 className="text-2xl font-bold text-text mb-4">Key Generation</h2>
            <p className="text-text-secondary mb-4">Generate secp256k1 key pairs for your users.</p>

            <div className="grid gap-4">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase mb-2">Request</p>
                <CodeBlock code={`POST /v1/keys/generate

{
  "user_id": "user_abc123",       // optional
  "metadata": {"role": "admin"}   // optional
}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase mb-2">Response (201)</p>
                <CodeBlock code={`{
  "key_id": "kp_7f8a9b0c1d2e3f4a",
  "public_key": {
    "x": "a1b2c3...hex",
    "y": "d4e5f6...hex",
    "compressed": "02a1b2c3...hex"
  },
  "private_key": "f7g8h9...hex",
  "curve": "secp256k1",
  "warning": "Store the private_key securely. It cannot be retrieved again."
}`} />
              </div>
            </div>
          </section>

          {/* Create & Verify */}
          <section id="proofs">
            <h2 className="text-2xl font-bold text-text mb-4">Create & Verify Proofs</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Create Proof</h3>
                <CodeBlock code={`POST /v1/proofs/create

{
  "private_key": "f7g8h9...hex",
  "public_key": "02a1b2c3...compressed_hex",
  "message": "login:user_123",  // optional
  "rounds": 1                   // 1-5, more = higher security
}

// Response 201:
{
  "proof_id": "prf_9a8b7c6d5e4f",
  "proof": {
    "commitment": {"x": "...", "y": "..."},
    "challenge": "abc123...hex",
    "response": "def456...hex"
  },
  "latency_ms": 0.34
}`} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Verify Proof</h3>
                <CodeBlock code={`POST /v1/proofs/verify

{
  "proof": { /* from create response */ },
  "public_key": "02a1b2c3...compressed_hex",
  "message": "login:user_123"
}

// Response 200:
{
  "valid": true,
  "verification_id": "vrf_1a2b3c4d",
  "latency_ms": 0.28
}`} />
              </div>
            </div>
          </section>

          {/* Auth Challenge */}
          <section id="auth-flow">
            <h2 className="text-2xl font-bold text-text mb-4">Challenge-Response Auth Flow</h2>
            <p className="text-text-secondary mb-6">Server-verified authentication using a time-limited challenge nonce.</p>

            <div className="rounded-xl border border-border bg-surface-2 p-6 mb-6">
              <div className="space-y-3 text-sm text-text-secondary">
                <p><span className="text-primary font-mono">1.</span> Your server requests a challenge for the user&apos;s public key</p>
                <p><span className="text-primary font-mono">2.</span> API returns a random nonce (expires in 60s)</p>
                <p><span className="text-primary font-mono">3.</span> User&apos;s browser creates a proof using their private key + nonce</p>
                <p><span className="text-primary font-mono">4.</span> Your server submits the proof to verify</p>
                <p><span className="text-primary font-mono">5.</span> API confirms authentication → user is logged in</p>
              </div>
            </div>

            <CodeBlock code={`// Step 1: Server requests challenge
const challenge = await zkp.createChallenge({
  publicKey: userPublicKey,
  sessionId: 'session_abc',
  ttlSeconds: 60,
});

// Step 2: Client creates proof with challenge nonce
const proof = await zkp.createProof({
  privateKey: userPrivateKey,
  publicKey: userPublicKey,
  message: challenge.challengeNonce,
});

// Step 3: Server verifies
const auth = await zkp.respondToChallenge({
  challengeId: challenge.challengeId,
  proof: proof.proof,
});

console.log(auth.authenticated); // true`} />
          </section>

          {/* JS SDK */}
          <section id="js-sdk">
            <h2 className="text-2xl font-bold text-text mb-4">JavaScript SDK</h2>
            <CodeBlock code="npm install @zkproofapi/sdk" lang="bash" />
            <div className="mt-4">
              <CodeBlock code={`import { ZKProofAPI, RateLimitError } from '@zkproofapi/sdk';

const zkp = new ZKProofAPI({
  apiKey: 'YOUR_API_KEY_HERE',
  baseUrl: 'https://api.zkproofapi.com',  // default
  timeout: 30000,                          // 30s default
});

try {
  const result = await zkp.verifyProof(params);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(\`Retry after \${error.retryAfter} seconds\`);
  }
}`} />
            </div>
          </section>

          {/* Python SDK */}
          <section id="python-sdk">
            <h2 className="text-2xl font-bold text-text mb-4">Python SDK</h2>
            <CodeBlock code="pip install zkproofapi" lang="bash" />
            <div className="mt-4">
              <CodeBlock code={`from zkproofapi import ZKProofAPI, RateLimitError

zkp = ZKProofAPI(api_key="YOUR_API_KEY_HERE")

# Generate keys
keys = zkp.generate_key_pair(user_id="user_123")

# Create and verify
proof = zkp.create_proof(
    private_key=keys["private_key"],
    public_key=keys["public_key"]["compressed"],
    message="login:user_123",
)

result = zkp.verify_proof(
    proof=proof["proof"],
    public_key=keys["public_key"]["compressed"],
    message="login:user_123",
)

print(result["valid"])  # True`} />
            </div>
          </section>

          {/* React SDK */}
          <section id="react-sdk">
            <h2 className="text-2xl font-bold text-text mb-4">React Hooks</h2>
            <CodeBlock code="npm install @zkproofapi/react" lang="bash" />
            <div className="mt-4">
              <CodeBlock code={`import { ZKProofProvider, useZKPAuth } from '@zkproofapi/react';

// Wrap your app
function App() {
  return (
    <ZKProofProvider apiKey="YOUR_API_KEY_HERE">
      <LoginPage />
    </ZKProofProvider>
  );
}

// Use the hook
function LoginPage() {
  const {
    authenticate,
    register,
    isAuthenticated,
    isLoading,
    error,
    logout,
  } = useZKPAuth();

  const handleRegister = async () => {
    const keys = await register('user_123');
    // Keys auto-stored in localStorage
  };

  const handleLogin = async () => {
    const result = await authenticate();
    if (result.authenticated) {
      router.push('/dashboard');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <>
          <button onClick={handleRegister}>Register</button>
          <button onClick={handleLogin}>
            {isLoading ? 'Verifying...' : 'Login with ZKP'}
          </button>
        </>
      )}
      {error && <p>{error}</p>}
    </div>
  );
}`} />
            </div>
          </section>

          {/* Errors */}
          <section id="errors">
            <h2 className="text-2xl font-bold text-text mb-4">Error Handling</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="text-left px-4 py-3 text-text-secondary">Code</th>
                    <th className="text-left px-4 py-3 text-text-secondary">Type</th>
                    <th className="text-left px-4 py-3 text-text-secondary">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["400", "invalid_request", "Malformed request body"],
                    ["400", "proof_invalid", "Proof failed verification"],
                    ["401", "invalid_api_key", "API key missing or invalid"],
                    ["402", "usage_limit_exceeded", "Monthly quota exceeded"],
                    ["403", "ip_not_allowed", "Request IP not in allowlist"],
                    ["410", "challenge_expired", "Auth challenge timed out"],
                    ["429", "rate_limit_exceeded", "Too many requests per minute"],
                    ["500", "internal_error", "Server error (contact support)"],
                  ].map(([code, type, desc]) => (
                    <tr key={type} className="bg-surface">
                      <td className="px-4 py-2.5 font-mono text-primary">{code}</td>
                      <td className="px-4 py-2.5 font-mono text-text">{type}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits">
            <h2 className="text-2xl font-bold text-text mb-4">Rate Limits</h2>
            <p className="text-text-secondary mb-4">Every response includes rate limit headers:</p>
            <CodeBlock code={`X-RateLimit-Limit: 100        // Max requests per minute
X-RateLimit-Remaining: 87    // Requests left this minute
X-RateLimit-Reset: 1713180060 // Unix timestamp of next reset`} />

            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="text-left px-4 py-3 text-text-secondary">Plan</th>
                    <th className="text-center px-4 py-3 text-text-secondary">Requests/min</th>
                    <th className="text-center px-4 py-3 text-text-secondary">Proofs/month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="bg-surface"><td className="px-4 py-2.5 text-text">Free</td><td className="px-4 py-2.5 text-center text-text-secondary">100</td><td className="px-4 py-2.5 text-center text-text-secondary">1,000</td></tr>
                  <tr className="bg-surface-2"><td className="px-4 py-2.5 text-text font-medium">Pro</td><td className="px-4 py-2.5 text-center text-primary">1,000</td><td className="px-4 py-2.5 text-center text-primary">50,000</td></tr>
                  <tr className="bg-surface"><td className="px-4 py-2.5 text-text">Enterprise</td><td className="px-4 py-2.5 text-center text-text-secondary">10,000</td><td className="px-4 py-2.5 text-center text-text-secondary">Unlimited</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
            <h2 className="text-xl font-bold text-text mb-2">Need help integrating?</h2>
            <p className="text-text-secondary mb-4">Our AI Copilot in the dashboard can generate custom integration code for your stack.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all">
              Try the Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

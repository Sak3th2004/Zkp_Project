import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Copy, Check } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}


const QUICK_PROMPTS = [
  "How do I integrate ZKP auth in React?",
  "Show me a Python login flow",
  "How does the challenge-response work?",
  "What are the rate limits?",
];

// Simple local response generator (no external AI API needed)
function generateResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('react') || msg.includes('javascript') || msg.includes('frontend')) {
    return `Here's how to integrate ZKP auth in a React app:

\`\`\`typescript
import { ZKProofAPI } from '@zkproofapi/sdk';

const zkp = new ZKProofAPI('sk_live_YOUR_KEY');

// On registration — generate & store keys
async function register(userId: string) {
  const keys = await zkp.generateKeyPair({ userId });
  // Store keys.publicKey.compressed in your DB
  // Give keys.privateKey to the user (store in their device)
  return keys;
}

// On login — create & verify proof
async function login(privateKey: string, publicKey: string) {
  const proof = await zkp.createProof({
    privateKey,
    publicKey,
    message: \`login:\${Date.now()}\`,
  });

  const result = await zkp.verifyProof({
    proof: proof.proof,
    publicKey,
    message: \`login:\${Date.now()}\`,
  });

  return result.valid; // true = authenticated
}
\`\`\`

**Key points:**
- Private key stays on the client device
- Each login creates a unique proof
- Verification is server-side, sub-5ms`;
  }

  if (msg.includes('python') || msg.includes('backend') || msg.includes('django') || msg.includes('flask')) {
    return `Here's a Python backend integration:

\`\`\`python
from zkproofapi import ZKProofAPI

zkp = ZKProofAPI(api_key="sk_live_YOUR_KEY")

# Registration
def register_user(user_id: str):
    keys = zkp.generate_key_pair(user_id=user_id)
    # Save keys["public_key"]["compressed"] to your DB
    # Return keys["private_key"] to the user ONCE
    return keys

# Login verification
def verify_login(proof: dict, public_key: str, message: str):
    result = zkp.verify_proof(
        proof=proof,
        public_key=public_key,
        message=message,
    )
    return result["valid"]  # True = authenticated
\`\`\`

Works with Flask, Django, FastAPI, or any Python framework.`;
  }

  if (msg.includes('challenge') || msg.includes('response') || msg.includes('auth flow')) {
    return `**Challenge-Response Auth Flow:**

1. **Client** → Server: "I want to log in as user_123"
2. **Server** → API: \`POST /v1/auth/challenge\` with user's public key
3. **API** → Server: Returns a unique challenge nonce (expires in 60s)
4. **Server** → Client: Sends the challenge
5. **Client** creates a proof using their private key + the challenge
6. **Client** → Server: Sends the proof
7. **Server** → API: \`POST /v1/auth/respond\` with the proof
8. **API** → Server: \`{ "authenticated": true }\`

\`\`\`typescript
// Server-side
const challenge = await zkp.createChallenge({
  publicKey: userPublicKey,
  sessionId: 'session_abc',
  ttlSeconds: 60,
});

// Client-side (after receiving challenge)
const proof = await zkp.createProof({
  privateKey: userPrivateKey,
  publicKey: userPublicKey,
  message: challenge.challengeNonce,
});

// Server-side verification
const auth = await zkp.respondToChallenge({
  challengeId: challenge.challengeId,
  proof: proof.proof,
});
\`\`\``;
  }

  if (msg.includes('rate limit') || msg.includes('limits') || msg.includes('pricing')) {
    return `**Rate Limits by Plan:**

| Plan | Proofs/mo | Verifications/mo | API Keys | Req/min |
|------|-----------|-------------------|----------|---------|
| Free | 1,000 | 5,000 | 2 | 100 |
| Pro ($29/mo) | 50,000 | 250,000 | 10 | 1,000 |
| Enterprise | Unlimited | Unlimited | Unlimited | 10,000 |

Rate limit headers are included in every response:
- \`X-RateLimit-Limit\`: Your per-minute limit
- \`X-RateLimit-Remaining\`: Requests left this minute
- \`X-RateLimit-Reset\`: Unix timestamp when the window resets

When rate limited, you'll get a **429** response with a \`Retry-After\` header.`;
  }

  if (msg.includes('batch') || msg.includes('bulk')) {
    return `**Batch Processing:**

Send up to 1,000 proofs in a single request:

\`\`\`bash
POST /v1/proofs/batch
{
  "operation": "verify",
  "items": [
    { "proof": {...}, "public_key": "02...", "message": "msg1" },
    { "proof": {...}, "public_key": "02...", "message": "msg2" }
  ],
  "webhook_url": "https://your-app.com/batch-done"
}
\`\`\`

Returns **202 Accepted** with a batch_id. Results delivered via webhook.`;
  }

  return `Great question! Here are the key things to know about ZKProofAPI:

**Quick Start:**
1. Sign up and get an API key from the dashboard
2. Install our SDK: \`npm install @zkproofapi/sdk\`
3. Generate keys, create proofs, verify — 3 lines of code

**Core Concepts:**
- **Key Generation**: Creates a secp256k1 key pair. Private key returned once.
- **Proof Creation**: Client creates a Schnorr proof with their private key
- **Proof Verification**: Server verifies the proof in <5ms
- **No passwords stored** — zero-knowledge means zero breach risk

Try asking me about:
- "How do I integrate in React?"
- "Show me the Python auth flow"
- "How does challenge-response work?"
- "What are the rate limits?"`;
}

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm ZKP Copilot 🤖\n\nI can help you integrate zero-knowledge authentication. Ask me anything about the API, SDKs, or auth flows!" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const response = generateResponse(userMsg);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 600);
  };

  const handleCopy = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[32rem] w-96 flex-col rounded-2xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">ZKP Copilot</p>
                <p className="text-xs text-success">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-3 hover:text-text">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[85%] rounded-xl px-3 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-surface border border-border text-text-secondary rounded-bl-sm'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.role === 'assistant' && msg.content.includes('```') && (
                    <button
                      onClick={() => handleCopy(i, msg.content)}
                      className="absolute top-2 right-2 rounded p-1 text-text-muted hover:text-text hover:bg-surface-3"
                    >
                      {copied === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-surface border border-border px-4 py-3 rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); }}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text-muted hover:border-primary/30 hover:text-primary transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 focus-within:border-primary/50">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about ZKP integration..."
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
              />
              <button onClick={handleSend} disabled={!input.trim()} className="rounded-lg bg-primary p-1.5 text-white disabled:opacity-30 hover:bg-primary-hover">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

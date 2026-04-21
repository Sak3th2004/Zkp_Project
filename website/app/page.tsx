import Link from "next/link";
import { Shield, Zap, Lock, Code, Globe, BarChart3, Check, ArrowRight, ExternalLink } from "lucide-react";

const features = [
  { icon: Zap, title: "Sub-5ms Verification", desc: "Schnorr proofs on secp256k1 verified in under 5 milliseconds. No blockchain required." },
  { icon: Lock, title: "Zero Knowledge", desc: "Users prove identity without revealing passwords. Private keys never leave the client." },
  { icon: Code, title: "3 Lines of Code", desc: "SDKs for JavaScript and Python. Full integration in under 10 minutes." },
  { icon: Globe, title: "99.9% Uptime SLA", desc: "Multi-region deployment with auto-failover. Built for production workloads." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Monitor every proof, verification, and auth flow from your developer dashboard." },
  { icon: Shield, title: "SOC 2 Ready", desc: "Complete audit logging, IP allowlisting, key rotation, and webhook notifications." },
];

const plans = [
  { name: "Free", price: "$0", period: "/mo", features: ["1,000 proofs/mo", "5,000 verifications/mo", "2 API keys", "Community support"], cta: "Start Free", href: "/signup", popular: false },
  { name: "Pro", price: "$29", period: "/mo", features: ["50,000 proofs/mo", "250,000 verifications/mo", "10 API keys", "Batch operations", "Webhooks", "Email support"], cta: "Start Pro Trial", href: "/signup?plan=pro", popular: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited proofs", "Unlimited verifications", "Unlimited API keys", "IP allowlisting", "Dedicated support", "Custom SLA"], cta: "Contact Sales", href: "/contact", popular: false },
];

const codeExample = `import { ZKProofAPI } from '@zkproofapi/sdk';

const zkp = new ZKProofAPI('sk_live_your_api_key');

// Generate a key pair
const keys = await zkp.generateKeyPair({ userId: 'user_123' });

// Create a proof (client-side)
const proof = await zkp.createProof({
  privateKey: keys.privateKey,
  publicKey: keys.publicKey.compressed,
  message: 'login:user_123',
});

// Verify the proof (server-side)
const result = await zkp.verifyProof({
  proof: proof.proof,
  publicKey: keys.publicKey.compressed,
});

console.log(result.valid); // true ✅`;

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">ZKProofAPI</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Pricing</a>
            <a href="https://github.com/Sak3th2004/Zkp_Project" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1"><ExternalLink className="h-4 w-4" /> GitHub</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">Log In</Link>
            <Link href="/signup" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[var(--primary)]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-1.5 text-sm font-medium text-[var(--primary)]">
            <Zap className="h-3.5 w-3.5" /> Now in Public Beta
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Zero-Knowledge Auth.{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
              Three Lines of Code.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)] leading-relaxed">
            Add passwordless, privacy-preserving authentication to any application.
            Schnorr proofs on secp256k1 with sub-5ms verification. No blockchain. No complexity.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup" className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-8 py-3.5 text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all">
              See How It Works
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">Free tier • No credit card required • 1,000 proofs/month</p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24 border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Enterprise-Grade ZKP Infrastructure</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">Everything you need to add zero-knowledge authentication</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-8 hover:border-[var(--primary)]/30 transition-all duration-300">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                  <f.icon className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Code Example ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-t border-[var(--border)] bg-[var(--surface-2)]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Integrate in Minutes</h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed">
                Our SDKs handle the cryptographic complexity. Generate keys, create proofs,
                and verify identities — all without ever storing passwords.
              </p>
              <div className="mt-8 space-y-4">
                {["Generate a secp256k1 key pair", "Create a Schnorr zero-knowledge proof", "Verify the proof server-side in &lt;5ms"].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">{i + 1}</div>
                    <span className="text-sm text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: step }} />
                  </div>
                ))}
              </div>
              <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors">
                Try It Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-[var(--text-muted)]">app.ts</span>
              </div>
              <pre className="overflow-x-auto text-sm leading-relaxed"><code className="text-[var(--text-secondary)]">{codeExample}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">Start free. Scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border p-8 transition-all ${plan.popular ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-xl shadow-[var(--primary)]/10" : "border-[var(--border)] bg-[var(--surface-2)]"}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-semibold text-white">Most Popular</span>}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-[var(--text-muted)]">{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Check className="h-4 w-4 text-[var(--success)] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`mt-8 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-all ${plan.popular ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg shadow-[var(--primary)]/25" : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to Go Passwordless?</h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Join developers building the future of authentication. Start with 1,000 free proofs per month.
          </p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-10 py-4 text-base font-semibold text-white shadow-xl shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all">
            Get Your API Key <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface-2)] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-[var(--text-secondary)] hover:text-white">Features</a>
                <a href="#pricing" className="block text-sm text-[var(--text-secondary)] hover:text-white">Pricing</a>
                <a href="/docs" className="block text-sm text-[var(--text-secondary)] hover:text-white">Documentation</a>
                <a href="/changelog" className="block text-sm text-[var(--text-secondary)] hover:text-white">Changelog</a>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Developers</h4>
              <div className="space-y-2">
                <a href="/docs/quickstart" className="block text-sm text-[var(--text-secondary)] hover:text-white">Quick Start</a>
                <a href="/docs/api" className="block text-sm text-[var(--text-secondary)] hover:text-white">API Reference</a>
                <a href="/docs/sdks" className="block text-sm text-[var(--text-secondary)] hover:text-white">SDKs</a>
                <a href="https://github.com/Sak3th2004/Zkp_Project" className="block text-sm text-[var(--text-secondary)] hover:text-white">GitHub</a>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Company</h4>
              <div className="space-y-2">
                <a href="/about" className="block text-sm text-[var(--text-secondary)] hover:text-white">About</a>
                <a href="/blog" className="block text-sm text-[var(--text-secondary)] hover:text-white">Blog</a>
                <a href="/contact" className="block text-sm text-[var(--text-secondary)] hover:text-white">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Legal</h4>
              <div className="space-y-2">
                <a href="/privacy" className="block text-sm text-[var(--text-secondary)] hover:text-white">Privacy Policy</a>
                <a href="/terms" className="block text-sm text-[var(--text-secondary)] hover:text-white">Terms of Service</a>
                <a href="/security" className="block text-sm text-[var(--text-secondary)] hover:text-white">Security</a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--text-muted)]">
            © 2026 ZKProofAPI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

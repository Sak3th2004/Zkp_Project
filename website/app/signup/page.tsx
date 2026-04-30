"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, Check, Copy, Download, Fingerprint, KeyRound } from "lucide-react";
import { generateKeyPair, storeKeyPair, downloadKeyBackup } from "@/lib/zkp-crypto";

const steps = [
  { num: 1, title: "Enter Details", desc: "Name & email only" },
  { num: 2, title: "Generate Key Pair", desc: "In your browser" },
  { num: 3, title: "Account Created", desc: "Zero-knowledge ✓" },
];

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: "", email: "", organization_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"form" | "generating" | "backup" | "success">("form");
  const [keyPair, setKeyPair] = useState<{ privateKey: string; publicKey: string } | null>(null);
  const [backedUp, setBackedUp] = useState(false);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ── Step 1: Generate key pair IN THE BROWSER ──
      setPhase("generating");
      await new Promise((r) => setTimeout(r, 800)); // Visual pause for UX

      const keys = generateKeyPair();
      setKeyPair(keys);

      // ── Step 2: Send public key to server (private key NEVER leaves browser) ──
      const res = await fetch("/dashboard/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          organization_name: form.organization_name,
          public_key: keys.publicKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");

      // ── Step 3: Store keys locally ──
      localStorage.setItem("zkp_token", data.access_token);
      storeKeyPair(keys.privateKey, keys.publicKey);

      setPhase("backup");
    } catch (err: any) {
      setError(err.message);
      setPhase("form");
    }
    setLoading(false);
  };

  const handleDownloadBackup = () => {
    if (keyPair) {
      downloadKeyBackup(keyPair.privateKey, form.email);
      setBackedUp(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 bg-surface-2 border-r border-border">
        <Link href="/">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text">ZKProofAPI</span>
          </div>
        </Link>

        <h2 className="text-3xl font-bold text-text mb-4">
          Zero-Knowledge Auth.<br />
          <span className="text-primary">No passwords. Just math.</span>
        </h2>

        <p className="text-text-secondary mb-10 text-lg leading-relaxed">
          Your private key is generated in your browser and never sent to our servers.
          Authentication uses Schnorr proofs over secp256k1 — the same cryptography that secures Bitcoin.
        </p>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold transition-all ${
                (phase === "form" && i === 0) || (phase === "generating" && i === 1) || ((phase === "backup" || phase === "success") && i === 2)
                  ? "bg-primary text-white" : "bg-primary/10 text-primary"
              }`}>
                {((phase === "backup" || phase === "success") && i < 2) || (phase === "generating" && i === 0)
                  ? <Check className="h-5 w-5" /> : s.num}
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{s.title}</p>
                <p className="text-xs text-text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ZKP explainer */}
        <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-primary">How ZKP signup works</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            We generate a secp256k1 key pair in your browser. Only the public key is sent to our server.
            To login, you prove you own the private key using a Schnorr zero-knowledge proof — without ever revealing it.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex flex-col items-center">
            <Link href="/">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
                <Shield className="h-7 w-7 text-white" />
              </div>
            </Link>
          </div>

          {/* ── Phase: Generating keys ── */}
          {phase === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
                  <KeyRound className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>
              <h2 className="text-xl font-bold text-text">Generating your key pair...</h2>
              <p className="text-sm text-text-secondary text-center">
                Creating secp256k1 keys in your browser.<br />
                Your private key never leaves this device.
              </p>
              <div className="flex gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* ── Phase: Backup private key ── */}
          {phase === "backup" && keyPair && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-text">Account Created! 🎉</h1>
                <p className="mt-2 text-sm text-text-secondary">Your zero-knowledge identity is ready.</p>
              </div>

              {/* Public key display */}
              <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Your Public Key (stored on server)</p>
                <div className="rounded-lg bg-surface px-3 py-2 font-mono text-xs text-primary break-all">
                  {keyPair.publicKey}
                </div>
              </div>

              {/* Private key warning + download */}
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">⚠️ IMPORTANT: Back up your private key</p>
                <p className="text-xs text-text-secondary">
                  Your private key is stored in this browser. If you clear browser data or switch devices,
                  you&apos;ll need this backup to login. <strong>We cannot recover it for you.</strong>
                </p>
                <button onClick={handleDownloadBackup}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20 transition-all">
                  <Download className="h-4 w-4" /> Download Key Backup
                </button>
                {backedUp && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Check className="h-3.5 w-3.5" /> Backup downloaded
                  </div>
                )}
              </div>

              {/* Continue button */}
              <button onClick={() => setPhase("success")}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  backedUp
                    ? "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
                    : "bg-surface-2 border border-border text-text-secondary"
                }`}>
                {backedUp ? <>Continue to Quick Start <ArrowRight className="h-4 w-4" /></> : "Please back up your key first"}
              </button>
            </div>
          )}

          {/* ── Phase: Success with code examples ── */}
          {phase === "success" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-text">Welcome, {form.full_name}!</h1>
                <p className="mt-2 text-sm text-text-secondary">Start integrating ZKProofAPI in your app:</p>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Install the SDK</p>
                <div className="rounded-lg bg-surface px-4 py-3 font-mono text-sm text-primary flex items-center justify-between">
                  <span>npm install @zkproofapi/sdk</span>
                  <button onClick={() => navigator.clipboard.writeText("npm install @zkproofapi/sdk")} className="text-text-muted hover:text-text"><Copy className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/" className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-center text-sm font-medium text-text hover:bg-surface-2 transition-all">
                  Home
                </Link>
                <Link href="/docs" className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                  View Docs →
                </Link>
              </div>
            </div>
          )}

          {/* ── Phase: Signup form (no password!) ── */}
          {phase === "form" && (
            <>
              <h1 className="text-2xl font-bold text-text text-center lg:text-left">Create your account</h1>
              <p className="mt-1 mb-2 text-sm text-text-secondary text-center lg:text-left">No password needed — powered by zero-knowledge proofs</p>

              {/* ZKP badge */}
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                <Fingerprint className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-text-secondary">
                  A secp256k1 key pair will be generated <strong className="text-text">in your browser</strong>. No password is ever created or transmitted.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Full Name</label>
                  <input type="text" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required placeholder="Jane Doe"
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Work Email</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="you@company.com"
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Organization</label>
                  <input type="text" value={form.organization_name} onChange={(e) => set("organization_name", e.target.value)} required placeholder="Acme Corp"
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>

                {/* NO PASSWORD FIELD — this is real ZKP! */}

                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
                  {loading ? "Generating keys…" : <><Fingerprint className="h-4 w-4" /> Create Account with ZKP</>}
                </button>

                <p className="text-center text-xs text-text-muted">
                  By signing up, you agree to our <a href="/terms" className="text-primary hover:underline">Terms</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </p>

                <p className="text-center text-sm text-text-secondary">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-primary hover:text-primary-light transition-colors">Sign in with ZKP</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

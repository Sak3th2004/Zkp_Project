"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Fingerprint, Upload, Loader2, Check, AlertCircle, KeyRound } from "lucide-react";
import { createProof, getStoredKeys, storeKeyPair } from "@/lib/zkp-crypto";

type Phase = "email" | "proving" | "success" | "restore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proofDetails, setProofDetails] = useState<{ latency: number } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check for stored private key
      const stored = getStoredKeys();
      if (!stored.privateKey || !stored.publicKey) {
        setError("No key found in this browser. Use 'Restore Key' if you have a backup, or sign up for a new account.");
        setLoading(false);
        return;
      }

      setPhase("proving");
      const startTime = performance.now();

      // ── Step 1: Request challenge from server ──
      const challengeRes = await fetch("/dashboard/login/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) throw new Error(challengeData.detail || "Challenge request failed");

      // ── Step 2: Create Schnorr proof using private key (IN BROWSER) ──
      const proof = createProof(
        stored.privateKey,
        stored.publicKey,
        challengeData.challenge_nonce
      );

      // ── Step 3: Submit proof to server for verification ──
      const verifyRes = await fetch("/dashboard/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeData.challenge_id,
          proof,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.detail || "Proof verification failed");

      const latency = Math.round(performance.now() - startTime);
      localStorage.setItem("zkp_token", verifyData.access_token);
      setProofDetails({ latency });
      setPhase("success");

    } catch (err: any) {
      setError(err.message);
      setPhase("email");
    }
    setLoading(false);
  };

  const handleRestoreKey = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.private_key) throw new Error("Invalid backup file");

      // Import: we need to regenerate public key from private key
      const { getPublicKey } = await import("@noble/secp256k1");
      const hexToBytes = (h: string) => { const b = new Uint8Array(h.length/2); for(let i=0;i<h.length;i+=2) b[i/2]=parseInt(h.substring(i,i+2),16); return b; };
      const bytesToHex = (b: Uint8Array) => Array.from(b).map(x => x.toString(16).padStart(2,"0")).join("");
      const privBytes = hexToBytes(backup.private_key);
      const pubBytes = getPublicKey(privBytes, true);
      const publicKey = bytesToHex(pubBytes);

      storeKeyPair(backup.private_key, publicKey);
      setEmail(backup.email || "");
      setPhase("email");
      setError("");
      alert("Key restored! You can now login.");
    } catch (err: any) {
      setError("Invalid backup file: " + err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Link href="/">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">Prove your identity with zero-knowledge</p>
        </div>

        {/* ── Proving phase ── */}
        {phase === "proving" && (
          <div className="rounded-2xl border border-primary/20 bg-surface-2 p-8 text-center space-y-6">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Fingerprint className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "2s" }} />
            </div>
            <h2 className="text-lg font-bold text-text">Creating zero-knowledge proof...</h2>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>✓ Challenge received from server</p>
              <p className="animate-pulse">⟳ Generating Schnorr proof in browser...</p>
              <p className="text-text-muted">Your private key never leaves this device</p>
            </div>
          </div>
        )}

        {/* ── Success phase ── */}
        {phase === "success" && (
          <div className="rounded-2xl border border-green-500/20 bg-surface-2 p-8 text-center space-y-6">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-text">Identity Verified! ✅</h2>
            <p className="text-sm text-text-secondary">
              Schnorr proof verified in {proofDetails?.latency}ms — no password was transmitted.
            </p>
            <div className="rounded-lg bg-surface border border-border p-3 text-xs text-text-muted space-y-1">
              <p>🔐 Auth method: <span className="text-primary font-mono">Schnorr ZKP</span></p>
              <p>📐 Curve: <span className="text-text font-mono">secp256k1</span></p>
              <p>⚡ Latency: <span className="text-text font-mono">{proofDetails?.latency}ms</span></p>
            </div>
            <Link href="/docs"
              className="block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all">
              Go to API Docs →
            </Link>
          </div>
        )}

        {/* ── Email + login form ── */}
        {phase === "email" && (
          <form onSubmit={handleLogin} className="rounded-2xl border border-border bg-surface-2 p-8 shadow-xl space-y-5">
            {/* ZKP badge */}
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <KeyRound className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-text-secondary">
                Login uses a <strong className="text-text">Schnorr zero-knowledge proof</strong> — no password needed
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>

            {/* NO PASSWORD FIELD — real ZKP auth! */}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Proving...</> : <><Fingerprint className="h-4 w-4" /> Sign In with ZKP</>}
            </button>

            {/* Restore key from backup */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-surface-2 px-2 text-text-muted">or</span></div>
            </div>

            <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-text-muted hover:border-primary/30 hover:text-text cursor-pointer transition-all">
              <Upload className="h-4 w-4" />
              <span>Restore key from backup file</span>
              <input type="file" accept=".json" onChange={handleRestoreKey} className="hidden" />
            </label>

            <p className="text-center text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:text-primary-light transition-colors">
                Create free account
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

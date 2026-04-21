"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, Check } from "lucide-react";

const steps = [
  { num: 1, title: "Create Account", desc: "30 seconds" },
  { num: 2, title: "Get API Key", desc: "Instant" },
  { num: 3, title: "Integrate", desc: "3 lines of code" },
];

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", organization_name: "" });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/dashboard/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");
      localStorage.setItem("zkp_token", data.access_token);
      window.location.href = "http://localhost:3000/dashboard/quickstart";
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-surface font-sans">
      {/* Left Panel - Benefits */}
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
          <span className="text-primary">Ready in 5 minutes.</span>
        </h2>

        <p className="text-text-secondary mb-10 text-lg leading-relaxed">
          Join developers adding passwordless authentication to their apps.
          No blockchain. No complexity. Just math.
        </p>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {s.num}
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{s.title}</p>
                <p className="text-xs text-text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <Check className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text">Free forever plan</span> — 1,000 proofs/month, no credit card required
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex flex-col items-center">
            <Link href="/">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
                <Shield className="h-7 w-7 text-white" />
              </div>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-text text-center lg:text-left">Create your account</h1>
          <p className="mt-1 mb-8 text-sm text-text-secondary text-center lg:text-left">Start with 1,000 free proofs per month</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Step 1: Personal */}
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Password</label>
              <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
              {loading ? "Creating account…" : <>Create Free Account <ArrowRight className="h-4 w-4" /></>}
            </button>

            <p className="text-center text-xs text-text-muted">
              By signing up, you agree to our <a href="/terms" className="text-primary hover:underline">Terms</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary-light transition-colors">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

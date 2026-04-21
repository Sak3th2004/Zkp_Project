"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      localStorage.setItem("zkp_token", data.access_token);
      window.location.href = "http://localhost:3000/dashboard";
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to your ZKProofAPI dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface-2 p-8 shadow-xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
              <button onClick={() => setError("")} className="float-right font-bold">×</button>
            </div>
          )}

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-text-muted hover:text-text">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 transition-all duration-200">
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:text-primary-light transition-colors">Create free account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

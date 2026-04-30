"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Check, X, ArrowRight, Zap, Building2, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Perfect for prototyping and side projects",
    icon: Zap,
    highlight: false,
    cta: "Get Started Free",
    features: [
      { name: "1,000 proofs/month", included: true },
      { name: "5,000 verifications/month", included: true },
      { name: "2 API keys", included: true },
      { name: "100 req/min rate limit", included: true },
      { name: "7-day audit log retention", included: true },
      { name: "Community support", included: true },
      { name: "Batch operations", included: false },
      { name: "Webhooks", included: false },
      { name: "Team members", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "For growing teams shipping to production",
    icon: Sparkles,
    highlight: true,
    badge: "Most Popular",
    cta: "Start Pro Trial",
    features: [
      { name: "50,000 proofs/month", included: true },
      { name: "250,000 verifications/month", included: true },
      { name: "10 API keys", included: true },
      { name: "1,000 req/min rate limit", included: true },
      { name: "90-day audit log retention", included: true },
      { name: "Email support (24hr SLA)", included: true },
      { name: "Batch operations (1,000 items)", included: true },
      { name: "Webhooks", included: true },
      { name: "5 team members", included: true },
      { name: "Usage overage: $0.001/proof", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations with scale and compliance needs",
    icon: Building2,
    highlight: false,
    cta: "Contact Sales",
    features: [
      { name: "Unlimited proofs", included: true },
      { name: "Unlimited verifications", included: true },
      { name: "Unlimited API keys", included: true },
      { name: "10,000 req/min rate limit", included: true },
      { name: "365-day audit log retention", included: true },
      { name: "Dedicated support + SLA", included: true },
      { name: "Batch operations (100K items)", included: true },
      { name: "Webhooks + custom events", included: true },
      { name: "Unlimited team members", included: true },
      { name: "IP allowlisting + SSO", included: true },
    ],
  },
];

const faqs = [
  {
    q: "What counts as a proof?",
    a: "Each call to /v1/proofs/create counts as one proof. Key generation and proof verification are counted separately. Health checks and usage queries are free.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes! Upgrade instantly, downgrade at the end of your billing cycle. No lock-in contracts. Your usage data is always preserved.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free tier is essentially a permanent trial. When you're ready to scale beyond 1,000 proofs/month, upgrade to Pro. No credit card required for Free.",
  },
  {
    q: "What happens if I exceed my limit?",
    a: "On Free: API returns 402 with an upgrade prompt. On Pro: you're charged $0.001 per additional proof (overage billing). On Enterprise: unlimited.",
  },
  {
    q: "Do you offer annual pricing?",
    a: "Yes! Annual plans get 2 months free. Contact us for annual pricing on Pro ($290/year instead of $348) or Enterprise custom quotes.",
  },
  {
    q: "What security certifications do you have?",
    a: "Our ZKP engine uses the same secp256k1 curve as Bitcoin. We're GDPR compliant (no PII stored), working toward SOC 2 Type II. Enterprise plans include HIPAA BAA.",
  },
];

const comparisonRows = [
  { feature: "Monthly Proofs", free: "1,000", pro: "50,000", enterprise: "Unlimited" },
  { feature: "Monthly Verifications", free: "5,000", pro: "250,000", enterprise: "Unlimited" },
  { feature: "API Keys", free: "2", pro: "10", enterprise: "Unlimited" },
  { feature: "Rate Limit", free: "100/min", pro: "1,000/min", enterprise: "10,000/min" },
  { feature: "Team Members", free: "1", pro: "5", enterprise: "Unlimited" },
  { feature: "Batch Operations", free: "—", pro: "1,000 items", enterprise: "100K items" },
  { feature: "Webhooks", free: "—", pro: "✓", enterprise: "✓ + Custom" },
  { feature: "Audit Log Retention", free: "7 days", pro: "90 days", enterprise: "365 days" },
  { feature: "IP Allowlisting", free: "—", pro: "—", enterprise: "✓" },
  { feature: "SSO / SAML", free: "—", pro: "—", enterprise: "✓" },
  { feature: "SLA", free: "—", pro: "99.9%", enterprise: "99.99%" },
  { feature: "Support", free: "Community", pro: "Email (24hr)", enterprise: "Dedicated" },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* Nav */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text">ZKProofAPI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text">Login</Link>
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
          Start free, scale as you grow. No hidden fees, no credit card required.
        </p>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? "text-text font-medium" : "text-text-muted"}`}>Monthly</span>
          <button onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-primary" : "bg-border"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${annual ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-sm ${annual ? "text-text font-medium" : "text-text-muted"}`}>
            Annual <span className="text-primary text-xs font-semibold ml-1">Save 17%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "border-primary bg-surface-2 shadow-2xl shadow-primary/10 scale-[1.02]"
                  : "border-border bg-surface-2"
              }`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.highlight ? "bg-primary" : "bg-primary/10"}`}>
                  <plan.icon className={`h-5 w-5 ${plan.highlight ? "text-white" : "text-primary"}`} />
                </div>
                <h3 className="text-xl font-bold text-text">{plan.name}</h3>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold text-text">
                  {plan.price === "Custom" ? "Custom" : annual && plan.price !== "$0" ? "$24" : plan.price}
                </span>
                {plan.period && <span className="text-text-muted text-sm">{plan.period}</span>}
              </div>
              <p className="text-sm text-text-secondary mb-6">{plan.desc}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.name} className="flex items-start gap-2">
                    {f.included ? (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${f.included ? "text-text" : "text-text-muted"}`}>{f.name}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.name === "Enterprise" ? "mailto:sales@zkproofapi.com" : "/signup"}
                className={`w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  plan.highlight
                    ? "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
                    : "border border-border bg-surface text-text hover:bg-surface-2"
                }`}>
                {plan.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-text text-center mb-10">Detailed Comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 border-b border-border">
                  <th className="text-left px-6 py-4 text-text-secondary font-medium">Feature</th>
                  <th className="text-center px-6 py-4 text-text font-semibold">Free</th>
                  <th className="text-center px-6 py-4 text-primary font-semibold">Pro</th>
                  <th className="text-center px-6 py-4 text-text font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-border ${i % 2 === 0 ? "bg-surface" : "bg-surface-2"}`}>
                    <td className="px-6 py-3 text-text">{row.feature}</td>
                    <td className="px-6 py-3 text-center text-text-secondary">{row.free}</td>
                    <td className="px-6 py-3 text-center text-text font-medium">{row.pro}</td>
                    <td className="px-6 py-3 text-center text-text-secondary">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-text text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface-2 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="text-sm font-medium text-text">{faq.q}</span>
                  <span className={`text-text-muted transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-12 text-center">
          <h2 className="text-3xl font-bold text-text mb-4">Ready to go passwordless?</h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto">
            Start with 1,000 free proofs per month. No credit card required.
            Integrate in under 5 minutes.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            Get Your Free API Key <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

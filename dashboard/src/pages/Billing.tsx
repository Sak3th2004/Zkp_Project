import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free', price: '$0', period: '/mo', current: true,
    features: ['1,000 proofs/mo', '5,000 verifications/mo', '2 API keys', '100 req/min', '7-day log retention'],
    cta: 'Current Plan',
  },
  {
    name: 'Pro', price: '$29', period: '/mo', current: false, popular: true,
    features: ['50,000 proofs/mo', '250,000 verifications/mo', '10 API keys', '1,000 req/min', 'Batch operations', 'Webhooks', '90-day log retention'],
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', current: false,
    features: ['Unlimited proofs', 'Unlimited verifications', 'Unlimited API keys', '10,000 req/min', 'IP allowlisting', 'Custom branding', 'Dedicated support', '365-day log retention'],
    cta: 'Contact Sales',
  },
];

const invoices = [
  { date: '2026-04-01', amount: '$0.00', status: 'paid', period: 'Apr 2026' },
  { date: '2026-03-01', amount: '$0.00', status: 'paid', period: 'Mar 2026' },
];

export default function Billing() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Billing</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your subscription and payment methods</p>
      </div>

      {/* Plan Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative rounded-xl border p-6 transition-all ${plan.popular ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border bg-surface-2'}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">Most Popular</span>
            )}
            <h3 className="text-lg font-bold text-text">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text">{plan.price}</span>
              <span className="text-sm text-text-muted">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="h-4 w-4 text-success shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              plan.current ? 'border border-border text-text-muted cursor-default' :
              plan.popular ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25' :
              'border border-border text-text hover:bg-surface-3'}`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div className="rounded-xl border border-border bg-surface-2 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Invoice History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-text-muted">Period</th>
              <th className="pb-3 text-left font-medium text-text-muted">Date</th>
              <th className="pb-3 text-left font-medium text-text-muted">Amount</th>
              <th className="pb-3 text-left font-medium text-text-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.date} className="border-b border-border last:border-0">
                <td className="py-3 text-text">{inv.period}</td>
                <td className="py-3 text-text-secondary">{inv.date}</td>
                <td className="py-3 text-text">{inv.amount}</td>
                <td className="py-3"><span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success capitalize">{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

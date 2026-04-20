import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [orgName, setOrgName] = useState('My Organization');
  const [slug, setSlug] = useState('my-org');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your organization settings</p>
      </div>

      {/* Organization Settings */}
      <div className="mb-8 rounded-xl border border-border bg-surface-2 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Organization</h2>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Name</label>
          <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Slug</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="mb-8 rounded-xl border border-border bg-surface-2 p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Notifications</h2>
        {[
          { label: 'Usage at 50%', desc: 'Email when reaching 50% of monthly limit' },
          { label: 'Usage at 80%', desc: 'Email when reaching 80% of monthly limit' },
          { label: 'Usage at 100%', desc: 'Email when monthly limit is reached' },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-text">{n.label}</p>
              <p className="text-xs text-text-muted">{n.desc}</p>
            </div>
            <button className="relative h-6 w-11 rounded-full bg-success transition-colors">
              <span className="absolute top-0.5 left-[22px] h-5 w-5 rounded-full bg-white shadow" />
            </button>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-danger" />
          <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
        </div>
        <p className="mb-4 text-sm text-text-secondary">Permanently delete this organization and all its data. This action cannot be undone.</p>
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Type organization name to confirm</label>
          <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={orgName}
            className="w-full rounded-lg border border-danger/30 bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20" />
        </div>
        <button disabled={deleteConfirm !== orgName}
          className="rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
          Delete Organization
        </button>
      </div>
    </div>
  );
}

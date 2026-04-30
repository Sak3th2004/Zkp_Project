import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/client';

interface TeamMember {
  id: string; full_name: string; email: string; role: string; created_at: string;
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard/team');
        setMembers(Array.isArray(res.data) ? res.data : res.data.members || []);
      } catch (err: any) {
        // If endpoint doesn't exist yet, show empty state
        setMembers([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleInvite = async () => {
    setInviting(true);
    try {
      const res = await api.post('/dashboard/team/invite', { email: inviteEmail, role: inviteRole });
      setMembers(prev => [...prev, res.data]);
      setShowInvite(false);
      setInviteEmail('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to invite — team API not yet available');
    }
    setInviting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Team</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage team members and permissions</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto font-bold">×</button>
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-2 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">You&apos;re the only member</h3>
          <p className="text-sm text-text-secondary mb-4">Invite team members to collaborate on your ZKP integration.</p>
          <button onClick={() => setShowInvite(true)}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
            Invite Your First Member
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-6 py-3 text-left font-medium text-text-muted">Name</th>
                <th className="px-6 py-3 text-left font-medium text-text-muted">Email</th>
                <th className="px-6 py-3 text-left font-medium text-text-muted">Role</th>
                <th className="px-6 py-3 text-left font-medium text-text-muted">Joined</th>
                <th className="px-6 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-6 py-4 font-medium text-text">{m.full_name}</td>
                  <td className="px-6 py-4 text-text-secondary">{m.email}</td>
                  <td className="px-6 py-4"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">{m.role}</span></td>
                  <td className="px-6 py-4 text-text-secondary">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-2 p-8">
            <h2 className="mb-6 text-xl font-bold text-text">Invite Team Member</h2>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Email</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Role</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none">
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowInvite(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-3">Cancel</button>
              <button onClick={handleInvite} disabled={!inviteEmail || inviting}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

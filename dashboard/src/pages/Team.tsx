import { useState } from 'react';
import { UserPlus, Trash2, Shield } from 'lucide-react';

const mockMembers = [
  { id: '1', name: 'Saketh Kumar', email: 'saketh@zkproofapi.com', role: 'owner', lastLogin: '2 min ago', active: true },
  { id: '2', name: 'Jane Doe', email: 'jane@company.com', role: 'admin', lastLogin: '1 hour ago', active: true },
  { id: '3', name: 'Dev User', email: 'dev@company.com', role: 'developer', lastLogin: '3 days ago', active: true },
];

const roleBadge: Record<string, string> = {
  owner: 'bg-warning/10 text-warning',
  admin: 'bg-primary/10 text-primary',
  developer: 'bg-success/10 text-success',
  viewer: 'bg-surface-3 text-text-muted',
};

export default function Team() {
  const [members, setMembers] = useState(mockMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');

  const invite = () => {
    if (!inviteEmail) return;
    setMembers((p) => [...p, { id: String(Date.now()), name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole, lastLogin: 'Never', active: true }]);
    setShowInvite(false); setInviteEmail('');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Team Management</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage members and their permissions</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {/* Roles Guide */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          { role: 'Owner', desc: 'Full access + billing + delete org' },
          { role: 'Admin', desc: 'Everything except billing' },
          { role: 'Developer', desc: 'API keys, logs, webhooks' },
          { role: 'Viewer', desc: 'Read-only access' },
        ].map((r) => (
          <div key={r.role} className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-sm font-medium text-text">{r.role}</span>
            </div>
            <p className="text-xs text-text-muted">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-6 py-3 text-left font-medium text-text-muted">Name</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Email</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Role</th>
              <th className="px-6 py-3 text-left font-medium text-text-muted">Last Login</th>
              <th className="px-6 py-3 text-right font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-6 py-4 font-medium text-text">{m.name}</td>
                <td className="px-6 py-4 text-text-secondary">{m.email}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadge[m.role]}`}>{m.role}</span>
                </td>
                <td className="px-6 py-4 text-text-secondary">{m.lastLogin}</td>
                <td className="px-6 py-4 text-right">
                  {m.role !== 'owner' && (
                    <button onClick={() => setMembers((p) => p.filter((x) => x.id !== m.id))} className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-2 p-8 shadow-2xl">
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
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowInvite(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-3">Cancel</button>
              <button onClick={invite} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

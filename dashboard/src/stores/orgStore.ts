import { create } from 'zustand';

interface OrgState {
  orgId: string | null;
  orgName: string | null;
  plan: string;
  setOrg: (org: { orgId: string; orgName: string; plan: string }) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  orgId: null,
  orgName: null,
  plan: 'free',
  setOrg: (org) => set(org),
}));

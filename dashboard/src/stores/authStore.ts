import { create } from 'zustand';
import api from '../api/client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  org_id: string;
  org_name: string;
  plan: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { full_name: string; email: string; password: string; organization_name: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('zkp_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('zkp_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/dashboard/login', { email, password });
      const { access_token } = res.data;
      localStorage.setItem('zkp_token', access_token);
      set({ token: access_token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Login failed', isLoading: false });
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/dashboard/signup', data);
      const { access_token } = res.data;
      localStorage.setItem('zkp_token', access_token);
      set({ token: access_token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Signup failed', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('zkp_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

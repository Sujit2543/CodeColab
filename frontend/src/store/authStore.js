import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('cc_token') || null,
  loading: false,
  error: null,

  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('cc_token', data.token);
      set({ token: data.token, user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('cc_token', data.token);
      set({ token: data.token, user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      set({ token: null, user: null });
      localStorage.removeItem('cc_token');
    }
  },

  logout: () => {
    localStorage.removeItem('cc_token');
    set({ token: null, user: null });
  },
}));

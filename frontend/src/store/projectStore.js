import { create } from 'zustand';
import api from '../api/axios';

export const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/projects');
      set({ projects: data.projects, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createProject: async (projectData) => {
    try {
      const { data } = await api.post('/projects', projectData);
      set((s) => ({ projects: [data.project, ...s.projects] }));
      return { success: true, project: data.project };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  getProject: async (id) => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      set({ currentProject: data.project });
      return data.project;
    } catch {
      return null;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const { data } = await api.put(`/projects/${id}`, updates);
      set((s) => ({
        projects: s.projects.map((p) => (p._id === id ? data.project : p)),
        currentProject: data.project,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      set((s) => ({ projects: s.projects.filter((p) => p._id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },
}));

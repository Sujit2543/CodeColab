import { create } from 'zustand';
import api from '../api/axios';

export const useRoomStore = create((set, get) => ({
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,

  fetchRooms: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/rooms');
      set({ rooms: data.rooms, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  createRoom: async (roomData) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/rooms', roomData);
      set((s) => ({ rooms: [data.room, ...s.rooms], loading: false }));
      return { success: true, room: data.room };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create room';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  getRoom: async (roomId) => {
    try {
      const { data } = await api.get(`/rooms/${roomId}`);
      set({ currentRoom: data.room });
      return data.room;
    } catch (err) {
      return null;
    }
  },

  deleteRoom: async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      set((s) => ({ rooms: s.rooms.filter((r) => r.roomId !== roomId) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },
}));

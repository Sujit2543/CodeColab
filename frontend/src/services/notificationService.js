import api from '../api/axios';

export const getNotifications = async (unreadOnly = false) => {
  const { data } = await api.get(`/notifications${unreadOnly ? '?unread=true' : ''}`);
  return data;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.put('/notifications/mark-all-read');
  return data;
};

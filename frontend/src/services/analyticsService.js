import api from '../api/axios';

export const getUserStats = async () => {
  const { data } = await api.get('/analytics/stats');
  return data;
};

export const getUserActivity = async () => {
  const { data } = await api.get('/analytics/activity');
  return data.activity;
};

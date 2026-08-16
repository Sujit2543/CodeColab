import axios from 'axios';

// Production (Vercel): VITE_API_URL = https://codecolab-2-un6h.onrender.com/api
// Local dev:           VITE_API_URL is empty → falls back to /api (Vite proxy → localhost:5000)
const rawUrl = import.meta.env.VITE_API_URL;
const baseURL = rawUrl && rawUrl.trim() !== '' ? rawUrl.trim() : '/api';

const api = axios.create({
  baseURL,
  timeout: 20000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cc_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

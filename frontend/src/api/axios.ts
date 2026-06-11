import axios from 'axios';

// Use environment-provided backend URL in production, with a safe fallback.
const API_BASE = (import.meta.env.VITE_API_URL as string) ?? 'https://steakz-restaurant-system.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Automatically attaches your JWT token from localStorage to headers for secure requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('steakz_token');
  if (token && config.headers) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
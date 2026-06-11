import axios from 'axios';

// Prefix with /api because backend mounts routes under /api
export const api = axios.create({
  baseURL: 'https://steakz-api-kz10.onrender.com/api', // 👈 Added /api to the end here
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
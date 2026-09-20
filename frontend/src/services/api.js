import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied via Vite to http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to inject the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, handle logout
      localStorage.removeItem('token');
      // For a real app, you might want to redirect using window.location or a global event
    }
    return Promise.reject(error);
  }
);

export default api;

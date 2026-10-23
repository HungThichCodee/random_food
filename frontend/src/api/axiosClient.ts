import axios from 'axios';
import { useUserStore } from '../stores/useUserStore';

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) throw new Error('VITE_API_URL must be set in the root .env');

const apiClient = axios.create({
  baseURL: `${apiUrl.replace(/\/$/, '')}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().profile?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle global errors here
    if (error.response && error.response.status === 429) {
      console.error('Rate limit exceeded');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

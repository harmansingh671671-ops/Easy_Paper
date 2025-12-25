import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    // We can't use the `useAuth` hook here, so we access the session from the window
    // This is a common pattern for setting auth headers in an API service file
    const clerk = window.Clerk;
    if (clerk && clerk.session) {
      const token = await clerk.session.getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
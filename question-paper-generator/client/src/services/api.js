import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

    try {
      const clerk = window.Clerk;
      if (clerk) {
        // Add Clerk User ID header
        if (clerk.user && clerk.user.id) {
          config.headers['X-Clerk-User-Id'] = clerk.user.id;
          console.log('X-Clerk-User-Id header injected.');
        } else {
          console.log('Clerk user not available.');
        }

        // Add JWT token for authorization
        if (clerk.session) {
          const token = await clerk.session.getToken();
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Authorization header (JWT) injected.');
          } else {
            console.log('No JWT token found in session.');
          }
        } else {
          console.log('Clerk session not available.');
        }
      } else {
        console.log('Clerk not available on window object.');
      }
    } catch (error) {
      console.error('Error setting auth headers:', error);
    }

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

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

let accessToken = null;
let onAuthFailure = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const registerAuthFailureCallback = (callback) => {
  onAuthFailure = callback;
};

// Request Interceptor: Auto-attach Access Token to headers
api.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Intercept 401s and perform refresh token rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop on auth endpoints
      if (originalRequest.url.includes('/api/auth/login') || originalRequest.url.includes('/api/auth/refresh')) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      try {
        // Attempt token refresh by invoking /api/auth/refresh with HttpOnly cookies
        const res = await axios.post('http://localhost:8080/api/auth/refresh', {}, { withCredentials: true });
        
        if (res.status === 200) {
          const newToken = res.data.accessToken;
          setAccessToken(newToken);
          
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        setAccessToken(null);
        if (onAuthFailure) {
          onAuthFailure();
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

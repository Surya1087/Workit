import axios from 'axios';
import { env } from '../config/env';

export const createApiClient = (getToken) => {
  const baseURL = env.apiBaseUrl?.replace(/\/$/, '') || '';

  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(async (config) => {
    // Avoid double /api/api if baseURL already includes /api
    if (baseURL.endsWith('/api') && typeof config.url === 'string' && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api\//, '/');
    }

    // Add Clerk token to request
    if (typeof getToken === 'function') {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Token added to request:', config.url);
        } else {
          console.warn('⚠️ No token available for request:', config.url);
        }
      } catch (error) {
        console.error('❌ Error getting token:', error);
      }
    }
    
    console.log('📤 Request:', {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers.Authorization,
    });
    
    return config;
  });

  // Add response interceptor for debugging
  instance.interceptors.response.use(
    (response) => {
      console.log('✅ Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('❌ Error Response:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );

  return instance;
};
import axios from 'axios';
import { env } from '../config/env';

const formatRequestTarget = (config, baseURL) => {
  const method = config.method?.toUpperCase() || 'GET';
  const url = config.url || '';
  return `${method} ${baseURL || ''}${url}`;
};

const setAuthorizationHeader = (headers, token) => {
  if (!headers) return;

  if (typeof headers.set === 'function') {
    headers.set('Authorization', `Bearer ${token}`);
    return;
  }

  headers.Authorization = `Bearer ${token}`;
};

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

    const requestTarget = formatRequestTarget(config, baseURL);

    if (typeof getToken === 'function') {
      const token = await getToken({ skipCache: true }).catch((error) => {
        console.error('[api] Failed to fetch Clerk token', {
          request: requestTarget,
          message: error?.message || 'Unknown Clerk token error',
        });
        return null;
      });

      if (token) {
        config.headers = config.headers || {};
        setAuthorizationHeader(config.headers, token);
        console.debug('[api] Attached Clerk bearer token', { request: requestTarget });
      } else {
        console.warn('[api] Proceeding without Clerk bearer token', { request: requestTarget });
      }
    }

    return config;
  }, (error) => {
    console.error('[api] Failed to prepare request', error);
    return Promise.reject(error);
  });

  instance.interceptors.response.use((response) => {
    console.debug('[api] Response received', {
      request: formatRequestTarget(response.config, baseURL),
      status: response.status,
    });
    return response;
  }, (error) => {
    const request = error?.config ? formatRequestTarget(error.config, baseURL) : 'UNKNOWN_REQUEST';
    console.error('[api] Request failed', {
      request,
      status: error?.response?.status || null,
      message: error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Request failed',
    });
    return Promise.reject(error);
  });

  return instance;
};

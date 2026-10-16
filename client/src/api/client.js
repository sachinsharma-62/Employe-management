import axios from 'axios';

export class ApiError extends Error {
  constructor(message, status = 0, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Automatically resolve and normalize the API base URL
export const getBaseUrl = () => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('ems_custom_api_url') : null;
  const envUrl = import.meta.env.VITE_API_URL || custom;
  if (!envUrl) {
    return '/api';
  }
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  // If user provided backend host (e.g. https://xxx.onrender.com) without /api, append /api
  if (!trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 60000, // 60s to accommodate Render free tier cold start
});

const plain = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 60000,
});

// Request interceptor: attach Bearer token if present (for browsers blocking cross-site cookies)
const attachAuth = (config) => {
  // Update baseURL dynamically in case custom URL was updated
  config.baseURL = getBaseUrl();
  const token = typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuth);
plain.interceptors.request.use(attachAuth);

const AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const toApiError = (error) => {
  if (error instanceof ApiError) return error;
  if (error.response) {
    const { status, data } = error.response;
    return new ApiError(
      data?.message || error.message || 'Request failed',
      status,
      data?.errors || null
    );
  }
  if (error.code === 'ECONNABORTED') {
    return new ApiError(
      'Server request timed out. If using Render (free tier), the server spins down after inactivity and may take 30-50 seconds to wake up. Please wait a moment and try again.',
      408
    );
  }
  return new ApiError(
    `Unable to reach server at ${getBaseUrl()}. Please ensure the backend is running and MongoDB Atlas allows 0.0.0.0/0.`,
    0
  );
};

let refreshPromise = null;

const refreshSession = () => {
  if (!refreshPromise) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('ems_refresh_token') : null;
    refreshPromise = plain
      .post('/auth/refresh', { refreshToken })
      .then((res) => {
        if (res.data?.token || res.data?.accessToken) {
          localStorage.setItem('ems_token', res.data.token || res.data.accessToken);
        }
        if (res.data?.refreshToken) {
          localStorage.setItem('ems_refresh_token', res.data.refreshToken);
        }
        return res.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => {
    // If response carries tokens, persist them for cross-domain auth
    if (response.data?.token || response.data?.accessToken) {
      localStorage.setItem('ems_token', response.data.token || response.data.accessToken);
    }
    if (response.data?.refreshToken) {
      localStorage.setItem('ems_refresh_token', response.data.refreshToken);
    }
    return response;
  },
  async (error) => {
    const original = error.config || {};
    const url = original.url || '';
    const isAuthPath = AUTH_PATHS.some((p) => url.includes(p));
    const status = error.response?.status;

    if (status === 401 && !original._retry && !isAuthPath) {
      original._retry = true;
      try {
        await refreshSession();
        return api(original);
      } catch (refreshError) {
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_refresh_token');
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw toApiError(refreshError);
      }
    }

    throw toApiError(error);
  }
);

export default api;

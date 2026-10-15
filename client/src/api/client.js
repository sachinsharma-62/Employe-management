import axios from 'axios';

export class ApiError extends Error {
  constructor(message, status = 0, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

const plain = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

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
    return new ApiError('Request timed out. Please try again.', 408);
  }
  return new ApiError('Unable to reach the server. Please check your connection.', 0);
};

let refreshPromise = null;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = plain
      .post('/auth/refresh')
      .then((res) => res.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
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
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw toApiError(refreshError);
      }
    }

    throw toApiError(error);
  }
);

export default api;

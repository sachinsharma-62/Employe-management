import api from './client';

const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword, confirmPassword) =>
    api.post(`/auth/reset-password/${token}`, { newPassword, confirmPassword }),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
  updateProfile: (formData) =>
    api.patch('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  securityInfo: () => api.get('/auth/security-info'),
};

export default authApi;

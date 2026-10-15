import api from './client';

const settingsApi = {
  get: () => api.get('/settings'),
  updateCompany: (formData) =>
    api.put('/settings/company', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updatePayroll: (payload) => api.put('/settings/payroll', payload),
  updateLeave: (payload) => api.put('/settings/leave', payload),
  updateHoliday: (payload) => api.put('/settings/holiday', payload),
  updateNotifications: (payload) => api.put('/settings/notifications', payload),
  updateEmail: (payload) => api.put('/settings/email', payload),
  testEmail: (payload) => api.post('/settings/email/test', payload),
};

export default settingsApi;
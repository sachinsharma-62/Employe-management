import api from './client';

const attendanceApi = {
  myMonth: (month) => api.get('/attendance/me', { params: { month } }),
  myCorrections: () => api.get('/attendance/me/corrections'),
  requestCorrection: (payload) => api.post('/attendance/me/corrections', payload),
  checkIn: (payload = {}) => api.post('/attendance/check-in', payload),
  checkOut: (payload = {}) => api.post('/attendance/check-out', payload),
  list: (params = {}) => api.get('/attendance', { params }),
  roster: (params = {}) => api.get('/attendance/roster', { params }),
  calendar: (params = {}) => api.get('/attendance/calendar', { params }),
  detail: (id) => api.get(`/attendance/${id}`),
  update: (id, payload) => api.patch(`/attendance/${id}`, payload),
  corrections: (params = {}) => api.get('/attendance/corrections', { params }),
  approveCorrection: (id, payload = {}) =>
    api.post(`/attendance/corrections/${id}/approve`, payload),
  rejectCorrection: (id, payload = {}) =>
    api.post(`/attendance/corrections/${id}/reject`, payload),
  holidays: (params = {}) => api.get('/attendance/holidays', { params }),
  settings: () => api.get('/attendance/settings'),
  updateSettings: (payload) => api.put('/attendance/settings', payload),
};

export default attendanceApi;
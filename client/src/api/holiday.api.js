import api from './client';

const holidayApi = {
  list: (params = {}) => api.get('/holidays', { params }),
  meta: () => api.get('/holidays/meta'),
  upcoming: (limit = 5) => api.get('/holidays/upcoming', { params: { limit } }),
  holiday: (id) => api.get(`/holidays/${id}`),
  create: (payload) => api.post('/holidays', payload),
  update: (id, payload) => api.put(`/holidays/${id}`, payload),
  remove: (id) => api.delete(`/holidays/${id}`),
};

export default holidayApi;
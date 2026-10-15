import api from './client';

const jobApi = {
  list: (params = {}) => api.get('/jobs', { params }),
  meta: () => api.get('/jobs/meta'),
  get: (id) => api.get(`/jobs/${id}`),
  create: (payload) => api.post('/jobs', payload),
  update: (id, payload) => api.put(`/jobs/${id}`, payload),
  remove: (id) => api.delete(`/jobs/${id}`),
};

export default jobApi;
import api from './client';

const candidateApi = {
  list: (params = {}) => api.get('/candidates', { params }),
  meta: () => api.get('/candidates/meta'),
  get: (id) => api.get(`/candidates/${id}`),
  create: (payload) => api.post('/candidates', payload),
  update: (id, payload) => api.put(`/candidates/${id}`, payload),
  remove: (id) => api.delete(`/candidates/${id}`),
};

export default candidateApi;
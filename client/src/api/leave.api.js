import api from './client';

const leaveApi = {
  myLeaves: (year) => api.get('/leaves/me', { params: { year } }),
  apply: (formData) =>
    api.post('/leaves/me/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  cancel: (id, payload = {}) => api.post(`/leaves/me/${id}/cancel`, payload),

  types: (all = false) => api.get('/leaves/types', { params: all ? { all: 'true' } : {} }),
  createType: (payload) => api.post('/leaves/types', payload),
  updateType: (id, payload) => api.put(`/leaves/types/${id}`, payload),
  removeType: (id) => api.delete(`/leaves/types/${id}`),

  requests: (params = {}) => api.get('/leaves/requests', { params }),
  request: (id) => api.get(`/leaves/requests/${id}`),
  approve: (id, payload = {}) => api.post(`/leaves/requests/${id}/approve`, payload),
  reject: (id, payload = {}) => api.post(`/leaves/requests/${id}/reject`, payload),

  balances: (params = {}) => api.get('/leaves/balances', { params }),
};

export default leaveApi;

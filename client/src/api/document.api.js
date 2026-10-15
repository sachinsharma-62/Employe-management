import api from './client';

const documentApi = {
  list: (params = {}) => api.get('/documents', { params }),
  mine: () => api.get('/documents/me'),
  stats: () => api.get('/documents/stats'),
  meta: () => api.get('/documents/meta'),
  get: (id) => api.get(`/documents/${id}`),
  upload: (formData) =>
    api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, payload) => api.patch(`/documents/${id}`, payload),
  verify: (id, payload) => api.post(`/documents/${id}/verify`, payload),
  remove: (id) => api.delete(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
};

export default documentApi;

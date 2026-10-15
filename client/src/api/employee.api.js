import api from './client';

const employeeApi = {
  list: (params = {}) => api.get('/employees', { params }),
  meta: () => api.get('/employees/meta'),
  get: (id) => api.get(`/employees/${id}`),
  create: (formData) =>
    api.post('/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    api.patch(`/employees/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  remove: (id) => api.delete(`/employees/${id}`),
  bulk: (action, ids) => api.post('/employees/bulk', { action, ids }),
  exportCsv: (params = {}) =>
    api.get('/employees/export', { params, responseType: 'blob' }),
};

export default employeeApi;

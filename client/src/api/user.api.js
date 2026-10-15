import api from './client';

const userApi = {
  list: (params = {}) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
};

export default userApi;

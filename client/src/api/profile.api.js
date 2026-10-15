import api from './client';

const profileApi = {
  get: (id) => api.get(`/employees/${id}/profile`),
  attendance: (id, params = {}) => api.get(`/employees/${id}/attendance`, { params }),
  leaves: (id) => api.get(`/employees/${id}/leaves`),
  payroll: (id) => api.get(`/employees/${id}/payroll`),
  performance: (id) => api.get(`/employees/${id}/performance`),
  goals: (id) => api.get(`/employees/${id}/goals`),
  assets: (id) => api.get(`/employees/${id}/assets`),
  documents: (id) => api.get(`/employees/${id}/documents`),
  notes: (id) => api.get(`/employees/${id}/notes`),
  activity: (id, params = {}) => api.get(`/employees/${id}/activity`, { params }),
  addNote: (id, payload) => api.post(`/employees/${id}/notes`, payload),
  removeNote: (id, noteId) => api.delete(`/employees/${id}/notes/${noteId}`),
  uploadDocument: (id, formData) =>
    api.post(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeDocument: (id, documentId) => api.delete(`/employees/${id}/documents/${documentId}`),
  download: (id) => api.get(`/employees/${id}/profile/download`, { responseType: 'blob' }),
};

export default profileApi;

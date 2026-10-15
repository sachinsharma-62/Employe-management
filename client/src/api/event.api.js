import api from './client';

const eventApi = {
  list: (params = {}) => api.get('/events', { params }),
  meta: () => api.get('/events/meta'),
  upcoming: (limit = 5) => api.get('/events/upcoming', { params: { limit } }),
  calendar: (start, end) => api.get('/events/calendar', { params: { start, end } }),
  event: (id) => api.get(`/events/${id}`),
  create: (payload) => api.post('/events', payload),
  update: (id, payload) => api.put(`/events/${id}`, payload),
  remove: (id) => api.delete(`/events/${id}`),
};

export default eventApi;

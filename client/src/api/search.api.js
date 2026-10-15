import api from './client';

const searchApi = {
  query: (params = {}) => api.get('/search', { params }),
};

export default searchApi;
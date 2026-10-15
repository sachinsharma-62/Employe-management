import api from './client';

const organizationApi = {
  employees: (params = {}) => api.get('/organization/employees', { params }),

  departments: (params = {}) => api.get('/organization/departments', { params }),
  department: (id) => api.get(`/organization/departments/${id}`),
  createDepartment: (payload) => api.post('/organization/departments', payload),
  updateDepartment: (id, payload) => api.patch(`/organization/departments/${id}`, payload),
  removeDepartment: (id) => api.delete(`/organization/departments/${id}`),
  assignDepartmentEmployees: (id, employeeIds) =>
    api.post(`/organization/departments/${id}/employees`, { employeeIds }),

  designations: (params = {}) => api.get('/organization/designations', { params }),
  designation: (id) => api.get(`/organization/designations/${id}`),
  createDesignation: (payload) => api.post('/organization/designations', payload),
  updateDesignation: (id, payload) => api.patch(`/organization/designations/${id}`, payload),
  removeDesignation: (id) => api.delete(`/organization/designations/${id}`),
  assignDesignationEmployees: (id, employeeIds) =>
    api.post(`/organization/designations/${id}/employees`, { employeeIds }),

  teams: (params = {}) => api.get('/organization/teams', { params }),
  team: (id) => api.get(`/organization/teams/${id}`),
  createTeam: (payload) => api.post('/organization/teams', payload),
  updateTeam: (id, payload) => api.patch(`/organization/teams/${id}`, payload),
  removeTeam: (id) => api.delete(`/organization/teams/${id}`),

  locations: (params = {}) => api.get('/organization/locations', { params }),
  location: (id) => api.get(`/organization/locations/${id}`),
  createLocation: (payload) => api.post('/organization/locations', payload),
  updateLocation: (id, payload) => api.patch(`/organization/locations/${id}`, payload),
  removeLocation: (id) => api.delete(`/organization/locations/${id}`),

  tree: () => api.get('/organization/tree'),
  managers: () => api.get('/organization/managers'),
  employmentTypes: () => api.get('/organization/employment-types'),
};

export default organizationApi;
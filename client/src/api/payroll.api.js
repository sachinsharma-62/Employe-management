import api from './client';

const payrollApi = {
  list: (params = {}) => api.get('/payroll', { params }),
  mine: () => api.get('/payroll/me'),
  stats: (params = {}) => api.get('/payroll/stats', { params }),
  departments: (params = {}) => api.get('/payroll/departments', { params }),
  report: (params = {}) => api.get('/payroll/report', { params }),
  downloadReport: (params = {}) =>
    api.get('/payroll/report/download', { params, responseType: 'blob' }),

  generate: (payload) => api.post('/payroll/generate', payload),
  bulk: (payload) => api.post('/payroll/bulk', payload),

  downloadPayslip: (id) =>
    api.get(`/payroll/${id}/payslip/download`, { responseType: 'blob' }),
  downloadPayslipPdf: (id) =>
    api.get(`/payroll/${id}/payslip.pdf`, { responseType: 'blob' }),

  sendPayslip: (id) => api.post(`/payroll/${id}/send`),
  sendPayslips: (payload) => api.post('/payroll/send', payload),
  history: (employeeId) => api.get(`/payroll/history/${employeeId}`),

  record: (id) => api.get(`/payroll/${id}`),
  update: (id, payload) => api.patch(`/payroll/${id}`, payload),
  remove: (id) => api.delete(`/payroll/${id}`),

  process: (id, payload = {}) => api.post(`/payroll/${id}/process`, payload),
  review: (id, payload = {}) => api.post(`/payroll/${id}/review`, payload),
  approve: (id, payload = {}) => api.post(`/payroll/${id}/approve`, payload),
  pay: (id, payload = {}) => api.post(`/payroll/${id}/pay`, payload),
  revert: (id, payload = {}) => api.post(`/payroll/${id}/revert`, payload),

  structures: (params = {}) => api.get('/payroll/salary-structures', { params }),
  structure: (employeeId) => api.get(`/payroll/salary-structures/${employeeId}`),
  saveStructure: (employeeId, payload) =>
    api.put(`/payroll/salary-structures/${employeeId}`, payload),
  removeStructure: (employeeId) => api.delete(`/payroll/salary-structures/${employeeId}`),
};

export default payrollApi;

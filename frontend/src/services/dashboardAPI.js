import axiosInstance from './apiClient';

const dashboardAPI = {
  getOverview: () => axiosInstance.get('/api/dashboard/overview'),
  getProductionSummary: (params) => axiosInstance.get('/api/dashboard/production-summary', { params }),
  getMachineUtilization: () => axiosInstance.get('/api/dashboard/machine-utilization'),
  getOperatorPerformance: () => axiosInstance.get('/api/dashboard/operator-performance'),
  getInventoryUsage: (params) => axiosInstance.get('/api/dashboard/inventory-usage', { params }),
  getPendingAlerts: () => axiosInstance.get('/api/dashboard/pending-alerts'),
  getAuditLogs: (params) => axiosInstance.get('/api/dashboard/audit-logs', { params }),
  exportAuditLogs: (format) => axiosInstance.get(`/api/dashboard/audit-logs/export/${format}`),
  getAllAlerts: () => axiosInstance.get('/api/dashboard/alerts'),
  getUnresolvedAlerts: () => axiosInstance.get('/api/dashboard/alerts/unresolved'),
  resolveAlert: (id) => axiosInstance.patch(`/api/dashboard/alerts/${id}/resolve`),
};

export default dashboardAPI;

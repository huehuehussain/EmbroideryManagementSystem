import axiosInstance from './apiClient';

const workOrderAPI = {
  getAllWorkOrders: () => axiosInstance.get('/api/work-orders'),
  getWorkOrderById: (id) => axiosInstance.get(`/api/work-orders/${id}`),
  createWorkOrder: (data) => axiosInstance.post('/api/work-orders', data),
  startWorkOrder: (id) => axiosInstance.post(`/api/work-orders/${id}/start`),
  completeWorkOrder: (id, quantity) =>
    axiosInstance.post(`/api/work-orders/${id}/complete`, { quantity_completed: quantity }),
  updateWorkOrderStatus: (id, status) =>
    axiosInstance.patch(`/api/work-orders/${id}/status`, { status }),
  deleteWorkOrder: (id) => axiosInstance.delete(`/api/work-orders/${id}`),
  calculateCost: (id) => axiosInstance.post(`/api/work-orders/${id}/calculate-cost`),
};

export default workOrderAPI;

import axiosInstance from './apiClient';

const customerOrderAPI = {
  getAllOrders: () => axiosInstance.get('/api/customer-orders'),
  getOrderById: (id) => axiosInstance.get(`/api/customer-orders/${id}`),
  createOrder: (data) => axiosInstance.post('/api/customer-orders', data),
  updateOrder: (id, data) => axiosInstance.patch(`/api/customer-orders/${id}`, data),
  deleteOrder: (id) => axiosInstance.delete(`/api/customer-orders/${id}`),
  updateOrderStatus: (id, status) =>
    axiosInstance.patch(`/api/customer-orders/${id}/status`, { status }),
  calculateCost: (design_id, quantity) =>
    axiosInstance.post('/api/customer-orders/calculate/cost', { design_id, quantity }),
};

export default customerOrderAPI;

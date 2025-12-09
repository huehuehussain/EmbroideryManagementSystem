import axiosInstance from './apiClient';

const inventoryAPI = {
  getAllItems: () => axiosInstance.get('/api/inventory'),
  getItemById: (id) => axiosInstance.get(`/api/inventory/${id}`),
  createItem: (data) => axiosInstance.post('/api/inventory', data),
  updateItem: (id, data) => axiosInstance.patch(`/api/inventory/${id}`, data),
  deleteItem: (id) => axiosInstance.delete(`/api/inventory/${id}`),
  deductStock: (id, quantity) => axiosInstance.post(`/api/inventory/${id}/deduct`, { quantity }),
  restockItem: (id, quantity) => axiosInstance.post(`/api/inventory/${id}/restock`, { quantity }),
  getLowStockItems: () => axiosInstance.get('/api/inventory/low-stock'),
  bulkDeductStock: (itemIds, quantities) =>
    axiosInstance.post('/api/inventory/bulk/deduct', { itemIds, quantities }),
};

export default inventoryAPI;

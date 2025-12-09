import axiosInstance from './apiClient';

const machineAPI = {
  getAllMachines: () => axiosInstance.get('/api/machines'),
  getMachineById: (id) => axiosInstance.get(`/api/machines/${id}`),
  createMachine: (data) => axiosInstance.post('/api/machines', data),
  updateMachine: (id, data) => axiosInstance.patch(`/api/machines/${id}`, data),
  deleteMachine: (id) => axiosInstance.delete(`/api/machines/${id}`),
  validateThreadColors: (id, thread_colors) =>
    axiosInstance.post(`/api/machines/${id}/validate-colors`, { thread_colors }),
  validateCapacity: (id, estimated_stitches) =>
    axiosInstance.post(`/api/machines/${id}/validate-capacity`, { estimated_stitches }),
};

export default machineAPI;

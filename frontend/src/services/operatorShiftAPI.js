import axiosInstance from './apiClient';

const operatorShiftAPI = {
  getAllShifts: (params) => axiosInstance.get('/api/operator-shifts', { params }),
  getShiftById: (id) => axiosInstance.get(`/api/operator-shifts/${id}`),
  getOperatorShifts: (operatorId, params) =>
    axiosInstance.get(`/api/operator-shifts/operator/${operatorId}`, { params }),
  createShift: (data) => axiosInstance.post('/api/operator-shifts', data),
  updateShift: (id, data) => axiosInstance.patch(`/api/operator-shifts/${id}`, data),
};

export default operatorShiftAPI;

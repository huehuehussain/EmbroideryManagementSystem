import axiosInstance from './apiClient';

const designAPI = {
  getAllDesigns: (params) => axiosInstance.get('/api/designs', { params }),
  getDesignById: (id) => axiosInstance.get(`/api/designs/${id}`),
  createDesign: (data) => axiosInstance.post('/api/designs', data),
  updateDesign: (id, data) => axiosInstance.patch(`/api/designs/${id}`, data),
  approveDesign: (id) => axiosInstance.patch(`/api/designs/${id}/approve`),
  rejectDesign: (id, rejection_reason) =>
    axiosInstance.patch(`/api/designs/${id}/reject`, { rejection_reason }),
  reviewDesign: (id) => axiosInstance.patch(`/api/designs/${id}/review`),
  deleteDesign: (id) => axiosInstance.delete(`/api/designs/${id}`),
};

export default designAPI;

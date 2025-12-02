import axiosInstance from './apiClient';

const designAPI = {
  getAllDesigns: (params) => axiosInstance.get('/api/designs', { params }),
  getDesignById: (id) => axiosInstance.get(`/api/designs/${id}`),
  uploadDesign: (formData) =>
    axiosInstance.post('/api/designs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  approveDesign: (id) => axiosInstance.patch(`/api/designs/${id}/approve`),
  rejectDesign: (id, rejection_reason) =>
    axiosInstance.patch(`/api/designs/${id}/reject`, { rejection_reason }),
  reviewDesign: (id) => axiosInstance.patch(`/api/designs/${id}/review`),
};

export default designAPI;

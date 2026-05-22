/**
 * Images API
 */
import apiClient from './client'

export const imagesAPI = {
  upload: (billboardId, formData) =>
    apiClient.post(`/images/billboards/${billboardId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (imageId) => apiClient.delete(`/images/${imageId}`),
  setPrimary: (imageId) => apiClient.patch(`/images/${imageId}/primary`),
}

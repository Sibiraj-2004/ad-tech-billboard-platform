/**
 * Billboards API
 * ================
 */
import apiClient from './client'

export const billboardsAPI = {
  list: (params) => apiClient.get('/billboards', { params }),
  getById: (id) => apiClient.get(`/billboards/${id}`),
  create: (data) => apiClient.post('/billboards', data),
  update: (id, data) => apiClient.patch(`/billboards/${id}`, data),
  delete: (id) => apiClient.delete(`/billboards/${id}`),
  getAvailability: (id) => apiClient.get(`/billboards/${id}/availability`),
  listAdminListings: (params) => apiClient.get('/billboards/admin/listings', { params }),
}

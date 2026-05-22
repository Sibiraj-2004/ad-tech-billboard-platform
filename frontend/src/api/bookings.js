/**
 * Bookings API
 */
import apiClient from './client'

export const bookingsAPI = {
  list: (params) => apiClient.get('/bookings', { params }),
  getById: (id) => apiClient.get(`/bookings/${id}`),
  create: (data) => apiClient.post('/bookings', data),
  cancel: (id) => apiClient.patch(`/bookings/${id}/cancel`),
  listRequests: (params) => apiClient.get('/bookings/requests/admin', { params }),
  approve: (id) => apiClient.post(`/bookings/${id}/approve`),
  reject: (id) => apiClient.post(`/bookings/${id}/reject`),
}

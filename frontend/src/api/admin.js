/**
 * Admin API
 */
import apiClient from './client'

export const adminAPI = {
  // Users
  listUsers: (params) => apiClient.get('/admin/users', { params }),
  updateUser: (id, data) => apiClient.patch(`/admin/users/${id}`, data),

  // Billboards
  listBillboards: (params) => apiClient.get('/admin/billboards', { params }),
  moderateBillboard: (id, status) =>
    apiClient.patch(`/admin/billboards/${id}/moderate`, null, { params: { status } }),

  // Bookings
  listBookings: (params) => apiClient.get('/admin/bookings', { params }),
  updateBooking: (id, status) =>
    apiClient.patch(`/admin/bookings/${id}`, null, { params: { status } }),

  // Analytics
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getRevenue: (period) => apiClient.get('/analytics/revenue', { params: { period } }),
  getTopBillboards: (limit) => apiClient.get('/analytics/top-billboards', { params: { limit } }),

  // Logs
  getLogs: (params) => apiClient.get('/admin/logs', { params }),

  // Categories
  listCategories: () => apiClient.get('/categories'),
  createCategory: (data) => apiClient.post('/categories', data),
}

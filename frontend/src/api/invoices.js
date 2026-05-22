/**
 * Invoices API
 */
import apiClient from './client'

export const invoicesAPI = {
  listAdmin: (params) => apiClient.get('/invoices/admin', { params }),
  listClient: (params) => apiClient.get('/invoices/client', { params }),
  listClients: () => apiClient.get('/invoices/clients'),
  create: (data) => apiClient.post('/invoices', data),
  getById: (id) => apiClient.get(`/invoices/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/invoices/${id}/status`, null, { params: { status } }),
}

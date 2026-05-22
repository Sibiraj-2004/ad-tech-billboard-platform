/**
 * Payments API (Razorpay)
 */
import apiClient from './client'

export const paymentsAPI = {
  createOrder: (data) => apiClient.post('/payments/create-order', data),
  verifyPayment: (data) => apiClient.post('/payments/verify', data),
  getConfig: () => apiClient.get('/payments/config'),
}

/**
 * Auth API
 * =========
 */
import apiClient from './client'

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),
}

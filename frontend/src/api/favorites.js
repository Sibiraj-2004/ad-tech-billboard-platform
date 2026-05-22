/**
 * Favorites API
 */
import apiClient from './client'

export const favoritesAPI = {
  list: (params) => apiClient.get('/favorites', { params }),
  add: (billboardId) => apiClient.post(`/favorites/${billboardId}`),
  remove: (billboardId) => apiClient.delete(`/favorites/${billboardId}`),
}

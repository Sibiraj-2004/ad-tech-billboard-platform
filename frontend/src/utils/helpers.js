/**
 * Helpers
 */

export function getImageUrl(path) {
  if (!path) return '/placeholder-billboard.jpg'
  if (path.startsWith('http')) return path
  return `/${path}`
}

export function getStatusColor(status) {
  const colors = {
    active: 'text-emerald-400',
    confirmed: 'text-emerald-400',
    completed: 'text-emerald-400',
    pending: 'text-amber-400',
    inactive: 'text-surface-400',
    cancelled: 'text-red-400',
    rejected: 'text-red-400',
  }
  return colors[status] || 'text-surface-400'
}

export function getErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return 'Something went wrong'
}

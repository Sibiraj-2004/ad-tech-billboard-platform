/**
 * Public Route Wrapper
 * Redirects to dashboard if already authenticated.
 * Use this for Login and Register pages.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../common/Spinner'
import { ROLES } from '../../utils/constants'

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <PageLoader />

  if (isAuthenticated) {
    // Redirect Admin to Admin Dashboard, others to User Dashboard
    const dashboardPath = user?.role === ROLES.ADMIN ? '/admin' : '/dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  return children
}

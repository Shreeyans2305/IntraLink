import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { selectIsAdmin, selectIsAuthenticated } from '../features/auth/authSlice'

function AdminRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isAdmin = useSelector(selectIsAdmin)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/chat" replace />
  }

  return <Outlet />
}

export default AdminRoute
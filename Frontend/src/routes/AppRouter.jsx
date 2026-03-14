import { Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from './AdminRoute'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ChatPage from '../pages/chat/ChatPage'
import DashboardPage from '../pages/admin/DashboardPage'
import ModerationPage from '../pages/admin/ModerationPage'
import AuditLogPage from '../pages/admin/AuditLogPage'
import TempRoomManagerPage from '../pages/admin/TempRoomManagerPage'
import BookmarksPage from '../pages/user/BookmarksPage'
import PreferencesPage from '../pages/user/PreferencesPage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/user/bookmarks" element={<BookmarksPage />} />
        <Route path="/user/preferences" element={<PreferencesPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/moderation" element={<ModerationPage />} />
        <Route path="/admin/audit-log" element={<AuditLogPage />} />
        <Route path="/admin/temp-rooms" element={<TempRoomManagerPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
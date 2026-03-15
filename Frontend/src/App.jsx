import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { selectUserPreferences } from './features/auth/authSlice'
import AppRouter from './routes/AppRouter'
import apiClient from './services/apiClient'

function App() {
  const preferences = useSelector(selectUserPreferences)
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme ?? 'slate'
    document.documentElement.dataset.density = preferences.density ?? 'comfortable'
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full'
  }, [preferences.density, preferences.reducedMotion, preferences.theme])

  useEffect(() => {
    apiClient.get('/org').then(res => {
      if (!res.data.exists) {
        navigate('/setup')
      } else if (location.pathname === '/setup') {
        navigate('/login')
      }
      setChecking(false)
    }).catch(err => {
      console.error("Failed to check org status", err)
      setChecking(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps so it only runs once

  if (checking) return null

  return <AppRouter />
}

export default App

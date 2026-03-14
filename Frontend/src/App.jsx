import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectUserPreferences } from './features/auth/authSlice'
import AppRouter from './routes/AppRouter'

function App() {
  const preferences = useSelector(selectUserPreferences)

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme ?? 'slate'
    document.documentElement.dataset.density = preferences.density ?? 'comfortable'
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full'
  }, [preferences.density, preferences.reducedMotion, preferences.theme])

  return <AppRouter />
}

export default App

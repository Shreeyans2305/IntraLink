import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { setTone } from '../../features/ai/aiSlice'
import { selectUserPreferences, setPreference } from '../../features/auth/authSlice'
import { selectNotifScope, setNotifScope } from '../../features/notifications/notifSlice'
import { usePushNotif } from '../../hooks/usePushNotif'

const themeData = [
  {
    id: 'slate',
    label: 'Slate',
    description: 'Classic dark with blue accents',
    preview: { bg: '#09090b', surface: '#18181b', accent: '#3b82f6', text: '#f4f4f5' },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Deep navy with sky-blue glow',
    preview: { bg: '#0a1628', surface: '#0f2038', accent: '#38bdf8', text: '#e2e8f0' },
  },
  {
    id: 'sand',
    label: 'Sand',
    description: 'Warm stone with amber highlights',
    preview: { bg: '#1c1917', surface: '#292524', accent: '#f59e0b', text: '#fafaf9' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep purple with violet accents',
    preview: { bg: '#0f0720', surface: '#170e30', accent: '#a78bfa', text: '#f0eaff' },
  },
]

function PreferencesPage() {
  const dispatch = useDispatch()
  const preferences = useSelector(selectUserPreferences)
  const notifScope = useSelector(selectNotifScope)
  const { permission, askPermission } = usePushNotif()

  const densities = ['compact', 'comfortable', 'spacious']

  return (
    <main className="app-page min-h-screen p-5" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <Link to="/chat" className="text-sm font-medium underline" style={{ color: 'var(--text-secondary)' }}>
          Back to Chat
        </Link>
      </div>

      <section className="space-y-4">
        {/* Theme Selection with Previews */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Theme</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {themeData.map((theme) => {
              const isActive = preferences.theme === theme.id
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => dispatch(setPreference({ key: 'theme', value: theme.id }))}
                  className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                    isActive ? 'ring-2 ring-offset-1' : 'hover:scale-[1.02]'
                  }`}
                  style={{
                    borderColor: isActive ? theme.preview.accent : 'var(--border-subtle)',
                    backgroundColor: theme.preview.bg,
                    ringColor: theme.preview.accent,
                  }}
                >
                  {/* Theme preview mini-bar */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: theme.preview.surface }} />
                    <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: theme.preview.surface }}>
                      <div className="m-1.5 h-2 w-2/3 rounded" style={{ backgroundColor: theme.preview.accent, opacity: 0.6 }} />
                      <div className="mx-1.5 h-1.5 w-1/2 rounded" style={{ backgroundColor: theme.preview.text, opacity: 0.3 }} />
                    </div>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                  </div>

                  <p className="text-sm font-semibold" style={{ color: theme.preview.text }}>{theme.label}</p>
                  <p className="text-xs" style={{ color: theme.preview.text, opacity: 0.6 }}>{theme.description}</p>

                  {isActive && (
                    <div className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: theme.preview.accent, color: theme.preview.bg }}>
                      Active
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </article>

        {/* Smart Replies */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Smart Replies</h2>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={preferences.smartRepliesEnabled}
              onChange={(event) =>
                dispatch(setPreference({ key: 'smartRepliesEnabled', value: event.target.checked }))
              }
            />
            Enable smart reply suggestions
          </label>
        </article>

        {/* Density */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Density</h2>
          <div className="flex flex-wrap gap-2">
            {densities.map((density) => (
              <Button
                key={density}
                variant={preferences.density === density ? 'primary' : 'secondary'}
                onClick={() => dispatch(setPreference({ key: 'density', value: density }))}
              >
                {density}
              </Button>
            ))}
          </div>
        </article>

        {/* Motion */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Motion</h2>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(event) =>
                dispatch(setPreference({ key: 'reducedMotion', value: event.target.checked }))
              }
            />
            Reduced motion mode
          </label>
        </article>

        {/* Smart Reply Tone */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Smart Reply Tone</h2>
          <div className="flex flex-wrap gap-2">
            {['formal', 'casual', 'technical'].map((tone) => (
              <Button
                key={tone}
                variant={preferences.tone === tone ? 'primary' : 'secondary'}
                onClick={() => {
                  dispatch(setPreference({ key: 'tone', value: tone }))
                  dispatch(setTone(tone))
                }}
              >
                {tone}
              </Button>
            ))}
          </div>
        </article>

        {/* Notification Scope */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notification Scope</h2>
          <select
            value={notifScope}
            onChange={(event) => dispatch(setNotifScope(event.target.value))}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">all</option>
            <option value="mentions">@mentions only</option>
            <option value="nothing">nothing</option>
          </select>
        </article>

        {/* Push Notifications */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Push Notifications</h2>
          <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Current permission: {permission}</p>
          <Button variant="secondary" onClick={askPermission}>
            Request Permission
          </Button>
        </article>

        {/* Current Profile Summary */}
        <article className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Current Profile</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-muted)' }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Theme</p>
              <p className="mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{preferences.theme}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-muted)' }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Density</p>
              <p className="mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{preferences.density}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-muted)' }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Motion</p>
              <p className="mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                {preferences.reducedMotion ? 'Reduced' : 'Standard'}
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default PreferencesPage
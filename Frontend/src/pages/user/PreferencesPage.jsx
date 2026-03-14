import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { setTone } from '../../features/ai/aiSlice'
import { selectUserPreferences, setPreference } from '../../features/auth/authSlice'
import { selectNotifScope, setNotifScope } from '../../features/notifications/notifSlice'
import { usePushNotif } from '../../hooks/usePushNotif'

function PreferencesPage() {
  const dispatch = useDispatch()
  const preferences = useSelector(selectUserPreferences)
  const notifScope = useSelector(selectNotifScope)
  const { permission, askPermission } = usePushNotif()

  const themes = ['slate', 'ocean', 'sand', 'midnight']
  const densities = ['compact', 'comfortable', 'spacious']

  return (
    <main className="app-page min-h-screen p-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">User Preferences</h1>
        <Link to="/chat" className="text-sm font-medium text-slate-700 underline">
          Back to Chat
        </Link>
      </div>

      <section className="space-y-4">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Smart Replies</h2>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={preferences.smartRepliesEnabled}
              onChange={(event) =>
                dispatch(
                  setPreference({
                    key: 'smartRepliesEnabled',
                    value: event.target.checked,
                  }),
                )
              }
            />
            Enable smart reply suggestions
          </label>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Theme</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {themes.map((theme) => (
              <Button
                key={theme}
                variant={preferences.theme === theme ? 'primary' : 'secondary'}
                onClick={() => dispatch(setPreference({ key: 'theme', value: theme }))}
              >
                {theme}
              </Button>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Density</h2>
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

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Motion</h2>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(event) =>
                dispatch(
                  setPreference({
                    key: 'reducedMotion',
                    value: event.target.checked,
                  }),
                )
              }
            />
            Reduced motion mode
          </label>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Smart Reply Tone</h2>
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

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Notification Scope</h2>
          <select
            value={notifScope}
            onChange={(event) => dispatch(setNotifScope(event.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">all</option>
            <option value="mentions">@mentions only</option>
            <option value="nothing">nothing</option>
          </select>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Push Notifications</h2>
          <p className="mb-2 text-sm text-slate-600">Current permission: {permission}</p>
          <Button variant="secondary" onClick={askPermission}>
            Request Permission
          </Button>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Current Workspace Profile</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-500">Theme</p>
              <p className="mt-1 font-semibold text-slate-900">{preferences.theme}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-500">Density</p>
              <p className="mt-1 font-semibold text-slate-900">{preferences.density}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-500">Motion</p>
              <p className="mt-1 font-semibold text-slate-900">
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
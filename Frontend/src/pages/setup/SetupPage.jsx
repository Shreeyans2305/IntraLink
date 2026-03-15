import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/apiClient'
import LoadingScreen from '../../components/ui/LoadingScreen'

function SetupPage() {                                            // ← added
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    org_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  })
  const [whitelists, setWhitelists] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [orgs, setOrgs] = useState([])
  const [orgLoading, setOrgLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/org').then(res => {
      setOrgs(res.data.orgs || [])
      setOrgLoading(false)
    }).catch(() => setOrgLoading(false))
  }, [])

  const handleAddWhitelist = () => {
    if (!newEmail) return
    setWhitelists(prev => [...prev, { email: newEmail, org_role: newRole }])
    setNewEmail('')
  }

  const handleRemoveWhitelist = (index) => {
    setWhitelists(prev => prev.filter((_, i) => i !== index))
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiClient.post('/org/setup', { ...formData, whitelists })
      const orgId = res.data?.org?.id
      alert(`Organization created! Org ID: ${orgId}\nPlease log in.`)
      navigate('/login')
    } catch (err) {
      console.error("Setup failed", err)
      alert(err.response?.data?.detail || "Setup failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingScreen isLoading={loading} loadingText="Setting up your workspace" />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-8">
        {/* Dynamic Background Elements */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-brand-600 opacity-20 blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full bg-blue-600 opacity-20 blur-[130px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500 opacity-10 blur-[120px] mix-blend-screen"></div>

        {orgLoading ? (
          <div className="relative z-10 w-full max-w-lg text-center text-zinc-400">Loading organizations...</div>
        ) : (
          <form
            className="relative z-10 w-full max-w-lg space-y-6 rounded-3xl border border-zinc-800/80 bg-white/5 p-8 text-white shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-10"
            onSubmit={onSubmit}
          >
            <header className="mb-6 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <img src="/LOGO.webp" alt="IntraLink" className="h-20 w-20 rounded-2xl object-cover" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Initialize Workspace</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Securely configure your organizational root node.<br />
                <span className="text-brand-400">Multiple organizations are supported. You can create a new one even if others exist.</span>
              </p>
              {orgs.length > 0 && (
                <div className="mt-3 text-xs text-zinc-400">
                  <span>Existing organizations:</span>
                  <ul className="mt-1 flex flex-wrap gap-2 justify-center">
                    {orgs.map(org => (
                      <li key={org.id} className="rounded border border-brand-500/30 bg-brand-500/10 px-2 py-1 text-brand-300 font-semibold">{org.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </header>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Organization Name</label>
              <input
                name="org_name"
                required
                value={formData.org_name}
                onChange={handleChange}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            <div className="pt-6 mt-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-full bg-white/10"></div>
                <h2 className="shrink-0 text-sm font-medium uppercase tracking-wider text-brand-400">Admin Account</h2>
                <div className="h-px w-full bg-white/10"></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">Full Name</label>
                  <input
                    name="admin_name"
                    required
                    value={formData.admin_name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">Email Address</label>
                  <input
                    type="email"
                    name="admin_email"
                    required
                    value={formData.admin_email}
                    onChange={handleChange}
                    placeholder="admin@company.com"
                    className="w-full rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">Security Key (Password)</label>
                  <input
                    type="password"
                    name="admin_password"
                    required
                    value={formData.admin_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-full bg-white/10"></div>
                <h2 className="shrink-0 text-sm font-medium uppercase tracking-wider text-brand-400">Initial Whitelist (Optional)</h2>
                <div className="h-px w-full bg-white/10"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-zinc-300">Invite Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@company.com"
                      className="w-full rounded-xl border border-zinc-800 bg-black/20 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs font-medium text-zinc-300">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2.5 text-sm text-white transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="user">User</option>
                      <option value="room_manager">Room Manager</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWhitelist}
                    className="rounded-xl border border-brand-500/30 bg-brand-600/20 px-4 py-2.5 text-sm font-medium text-brand-400 hover:bg-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    Add
                  </button>
                </div>

                {whitelists.length > 0 && (
                  <div className="mt-3 divide-y divide-white/5 rounded-xl border border-zinc-800 bg-black/10">
                    {whitelists.map((wl, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{wl.email}</span>
                          <span className="text-xs text-zinc-400">{wl.org_role === 'room_manager' ? 'Room Manager' : 'User'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveWhitelist(idx)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center overflow-hidden rounded-xl bg-brand-600 px-4 py-4 text-sm font-bold tracking-wide text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? 'Bootstrapping...' : 'Initialize Organization'}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
            </button>
          </form>
        )}
      </main>
    </>
  )
}

export default SetupPage
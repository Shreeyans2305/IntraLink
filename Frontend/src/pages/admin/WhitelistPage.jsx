import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import apiClient from '../../services/apiClient'

function WhitelistPage() {
  const [whitelist, setWhitelist] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [loading, setLoading] = useState(true)

  const fetchWhitelist = async () => {
    try {
      const res = await apiClient.get('/admin/whitelist')
      setWhitelist(res.data)
    } catch (err) {
      console.error("Failed to fetch whitelist", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWhitelist()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newEmail) return
    try {
      await apiClient.post('/admin/whitelist', { email: newEmail, org_role: newRole })
      setNewEmail('')
      setNewRole('user')
      fetchWhitelist()
    } catch (err) {
      console.error("Failed to add whitelist", err)
      alert(err.response?.data?.detail || "Failed to add whitelist.")
    }
  }

  const handleRevoke = async (email) => {
    if (!window.confirm(`Revoke whitelist for ${email}?`)) return
    try {
      await apiClient.delete(`/admin/whitelist/${encodeURIComponent(email)}`)
      fetchWhitelist()
    } catch (err) {
      console.error("Failed to revoke whitelist", err)
      alert(err.response?.data?.detail || "Failed to revoke whitelist.")
    }
  }

  return (
    <div className="app-page bg-zinc-950 text-zinc-200 flex min-h-screen">
      <aside className="app-surface bg-zinc-900/20 w-64 border-r p-4">
        <h1 className="mb-4 text-lg font-semibold text-zinc-100">IntraLink Admin</h1>
        <nav className="space-y-2 text-sm">
          <Link to="/admin/dashboard" className="block rounded-md border border-zinc-800 px-3 py-2">
            📊 Analytics
          </Link>
          <Link to="/admin/moderation" className="block rounded-md border border-zinc-800 px-3 py-2">
            🛡 Moderation
          </Link>
          <Link to="/admin/audit-log" className="block rounded-md border border-zinc-800 px-3 py-2">
            📋 Audit Log
          </Link>
          <Link to="/admin/temp-rooms" className="block rounded-md border border-zinc-800 px-3 py-2">
            ⏳ Temp Rooms
          </Link>
          <Link to="/admin/whitelist" className="block rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-medium">
            📋 Whitelist
          </Link>
          <Link to="/chat" className="block rounded-md border border-zinc-800 px-3 py-2 mt-4 text-zinc-400">
            ← Back to Chat
          </Link>
        </nav>
      </aside>

      <main className="flex-1 space-y-4 p-5 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-zinc-100">Whitelist Management</h2>
        <p className="text-sm text-zinc-400 mb-6">Manage pre-approved emails and their roles for registration to this organization.</p>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Add Whitelist Entry</h3>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full rounded-md border border-zinc-700 bg-zinc-900/40 text-zinc-100 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Role</label>
              <select
                className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm bg-zinc-900/40 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="room_manager">Room Manager</option>
              </select>
            </div>
            <Button type="submit" variant="primary">Add User</Button>
          </form>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/50 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-zinc-200">Pending Whitelists</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900/60">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900/40 divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-4 text-center text-sm text-zinc-400">Loading...</td>
                  </tr>
                ) : whitelist.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-sm text-zinc-400">No pending whitelists found.</td>
                  </tr>
                ) : (
                  whitelist.map((wl, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-100 font-medium">{wl.email}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-400">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          wl.org_role === 'room_manager' ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-800 text-zinc-200'
                        }`}>
                          {wl.org_role}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleRevoke(wl.email)}
                          className="text-red-500 hover:text-red-900 bg-red-500/10 hover:bg-red-500/20 transition-colors px-3 py-1 rounded-md transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default WhitelistPage

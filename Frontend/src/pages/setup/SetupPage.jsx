import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/apiClient'

function SetupPage() {
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
      await apiClient.post('/org/setup', { ...formData, whitelists })
      alert("Organization created! Please log in.")
      navigate('/login')
    } catch (err) {
      console.error("Setup failed", err)
      alert(err.response?.data?.detail || "Setup failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      {/* Dynamic Background Elements */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-600 opacity-20 blur-[120px] mix-blend-screen animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full bg-cyan-600 opacity-20 blur-[130px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 opacity-10 blur-[120px] mix-blend-screen"></div>

      <form
        className="relative z-10 w-full max-w-lg space-y-6 rounded-3xl border border-white/5 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl sm:p-10"
        onSubmit={onSubmit}
      >
        <header className="mb-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-xl shadow-emerald-500/30">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Initialize Workspace</h1>
          <p className="mt-2 text-sm text-slate-400">
            Securely configure your organizational root node.
          </p>
        </header>

        <div>
           <label className="mb-1 block text-sm font-medium text-slate-300">Organization Name</label>
           <input
             name="org_name"
             required
             value={formData.org_name}
             onChange={handleChange}
             placeholder="Acme Corp"
             className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
           />
        </div>

        <div className="pt-6 mt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-full bg-white/10"></div>
            <h2 className="shrink-0 text-sm font-medium uppercase tracking-wider text-emerald-400">Admin Account</h2>
            <div className="h-px w-full bg-white/10"></div>
          </div>
          <div className="space-y-4">
             <div>
               <label className="mb-1 block text-sm font-medium text-slate-300">Full Name</label>
               <input
                 name="admin_name"
                 required
                 value={formData.admin_name}
                 onChange={handleChange}
                 placeholder="Jane Doe"
                 className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
               />
             </div>
             <div>
               <label className="mb-1 block text-sm font-medium text-slate-300">Email Address</label>
               <input
                 type="email"
                 name="admin_email"
                 required
                 value={formData.admin_email}
                 onChange={handleChange}
                 placeholder="admin@company.com"
                 className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
               />
             </div>
             <div>
               <label className="mb-1 block text-sm font-medium text-slate-300">Security Key (Password)</label>
               <input
                 type="password"
                 name="admin_password"
                 required
                 value={formData.admin_password}
                 onChange={handleChange}
                 placeholder="••••••••"
                 className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
               />
             </div>
          </div>
        </div>

        <div className="pt-6 mt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-full bg-white/10"></div>
            <h2 className="shrink-0 text-sm font-medium uppercase tracking-wider text-cyan-400">Initial Whitelist (Optional)</h2>
            <div className="h-px w-full bg-white/10"></div>
          </div>
          <div className="space-y-3">
             <div className="flex items-end gap-2">
               <div className="flex-1">
                 <label className="mb-1 block text-xs font-medium text-slate-300">Invite Email</label>
                 <input
                   type="email"
                   value={newEmail}
                   onChange={(e) => setNewEmail(e.target.value)}
                   placeholder="user@company.com"
                   className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                 />
               </div>
               <div className="w-32">
                 <label className="mb-1 block text-xs font-medium text-slate-300">Role</label>
                 <select
                   value={newRole}
                   onChange={(e) => setNewRole(e.target.value)}
                   className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                 >
                   <option value="user">User</option>
                   <option value="room_manager">Room Manager</option>
                 </select>
               </div>
               <button
                 type="button"
                 onClick={handleAddWhitelist}
                 className="rounded-xl border border-cyan-500/30 bg-cyan-600/20 px-4 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-600/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
               >
                 Add
               </button>
             </div>

             {whitelists.length > 0 && (
               <div className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 bg-black/10">
                 {whitelists.map((wl, idx) => (
                   <div key={idx} className="flex items-center justify-between p-3">
                     <div className="flex flex-col">
                       <span className="text-sm font-medium text-white">{wl.email}</span>
                       <span className="text-xs text-slate-400">{wl.org_role === 'room_manager' ? 'Room Manager' : 'User'}</span>
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
          className="group relative flex w-full justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-4 text-sm font-bold tracking-wide text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? 'Bootstrapping...' : 'Initialize Organization'}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
        </button>
      </form>
    </main>
  )
}

export default SetupPage

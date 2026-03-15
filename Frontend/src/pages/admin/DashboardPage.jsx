import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ActivityChart from '../../components/dashboard/ActivityChart'
import ActivityHeatmap from '../../components/dashboard/ActivityHeatmap'
import MetricCard from '../../components/dashboard/MetricCard'
import SpamFeed from '../../components/dashboard/SpamFeed'
import Button from '../../components/ui/Button'
import SkeletonBlock from '../../components/ui/SkeletonBlock'
import { useAdmin } from '../../features/admin/useAdmin'
import apiClient from '../../services/apiClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUsers, fetchRooms, addRoomMember, updateRoomMember } from '../../features/messaging/messagingApi'

function AssignManagerWidget() {
  const queryClient = useQueryClient()
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedUser, setSelectedUser] = useState('')

  const { data: users = [] } = useQuery({ queryKey: ['adminUsers'], queryFn: fetchUsers })
  const { data: rooms = [] } = useQuery({ queryKey: ['adminRooms'], queryFn: fetchRooms })

  const assignMutation = useMutation({
    mutationFn: async () => {
      const room = rooms.find(r => r.id === selectedRoom)
      const existing = room?.members?.find(m => m.user_id === selectedUser)
      if (existing) {
        return updateRoomMember(selectedRoom, selectedUser, { room_role: 'room_manager' })
      } else {
        return addRoomMember(selectedRoom, { user_id: selectedUser, room_role: 'room_manager' })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      alert("Room Manager assigned successfully!")
      setSelectedUser('')
      setSelectedRoom('')
    },
    onError: (err) => alert(err.response?.data?.detail || "Failed to assign manager")
  })

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 xl:col-span-3 mt-0 mb-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Assign Room Manager</h3>
        <span className="text-xs text-slate-500">Elevate user privileges for specific rooms</span>
      </div>
      <div className="flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="mb-1 block text-xs text-slate-500">Pick a Room</label>
          <select 
            value={selectedRoom} 
            onChange={e => setSelectedRoom(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none"
          >
            <option value="">-- Select Room --</option>
            {rooms.map(r => <option key={r.id} value={r.id}>#{r.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="mb-1 block text-xs text-slate-500">Pick a User</label>
          <select 
            value={selectedUser} 
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none"
          >
            <option value="">-- Select User --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <Button 
            disabled={!selectedRoom || !selectedUser || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
            className="w-full md:w-auto"
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign Manager'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function BlastModal({ open, onClose, onConfirm }) {
  const [passphrase, setPassphrase] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-slate-900 p-5 shadow-2xl">
        <h3 className="mb-2 text-lg font-semibold text-white">💥 Blast Org</h3>
        <p className="mb-4 text-sm text-slate-400">
          WARNING: This will wipe all messages, rooms, and temp rooms. Enter a strong passphrase to encrypt the org blueprint.
        </p>
        <input 
          type="password"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          placeholder="Encryption Passphrase"
          className="mb-4 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-300">Cancel</Button>
          <Button disabled={!passphrase} onClick={() => onConfirm(passphrase)} className="bg-red-600 hover:bg-red-500 text-white">
            Wipe & Encrypt
          </Button>
        </div>
      </div>
    </div>
  )
}

function RestoreModal({ open, onClose, onConfirm }) {
  const [passphrase, setPassphrase] = useState('')
  const [file, setFile] = useState(null)
  
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-cyan-500/30 bg-slate-900 p-5 shadow-2xl">
        <h3 className="mb-2 text-lg font-semibold text-white">📥 Restore Blueprint</h3>
        <p className="mb-4 text-sm text-slate-400">
          Upload your `.inm` blueprint and enter the passphrase used to decrypt it.
        </p>
        <input 
          type="file"
          accept=".inm"
          onChange={e => setFile(e.target.files[0])}
          className="mb-3 w-full text-sm text-slate-300"
        />
        <input 
          type="password"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          placeholder="Decryption Passphrase"
          className="mb-4 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-300">Cancel</Button>
          <Button disabled={!passphrase || !file} onClick={() => onConfirm(file, passphrase)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
            Restore
          </Button>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { metrics, activitySeries, moderationQueue } = useAdmin()
  const [range, setRange] = useState('today')
  const [refreshing, setRefreshing] = useState(false)
  const [lockdownActive, setLockdownActive] = useState(false)
  
  const [showBlastModal, setShowBlastModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)

  // Fetch initial lockdown state
  useEffect(() => {
    apiClient.get('/admin/lockdown').then((res) => {
      setLockdownActive(res.data.active)
    }).catch(err => console.error("Failed to fetch lockdown state", err))
  }, [])

  const handleToggleLockdown = async () => {
    try {
      const resp = await apiClient.post('/admin/lockdown', { active: !lockdownActive })
      setLockdownActive(resp.data.active)
    } catch (err) {
      console.error("Failed to toggle lockdown", err)
    }
  }

  const handleBlastExecute = async (passphrase) => {
    setShowBlastModal(false)
    try {
      const response = await apiClient.post('/admin/blast', { passphrase }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'blueprint.inm')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      alert("Blast successful. Data wiped. Check your downloads for blueprint.inm.")
    } catch (err) {
      console.error("Blast failed", err)
      alert("Blast failed.")
    }
  }

  const handleRestoreExecute = (file, passphrase) => {
    setShowRestoreModal(false)
    const reader = new FileReader()
    reader.onload = async (re) => {
      // convert array buffer to base64
      const bytes = new Uint8Array(re.target.result)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64Data = window.btoa(binary)
      
      try {
        const resp = await apiClient.post('/admin/import-blueprint', {
          data: base64Data,
          passphrase
        })
        alert(`Restore successful! Created ${resp.data.rooms_created} rooms and restored ${resp.data.whitelists_restored} whitelists.`)
      } catch (err) {
        console.error("Restore failed", err)
        alert("Restore failed. Invalid file or wrong passphrase.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const scale = {
    today: 1,
    '7d': 1.18,
    '30d': 1.36,
  }[range]

  const chartData = useMemo(
    () =>
      activitySeries.map((item) => ({
        ...item,
        messages: Math.round(item.messages * scale),
      })),
    [activitySeries, scale],
  )

  const heatmapValues = useMemo(() => chartData.map((item) => item.messages), [chartData])

  const metricCards = [
    {
      label: 'Online',
      value: metrics.onlineUsers,
      trend: '+9%',
      sparkline: [24, 38, 40, 58, 62, 72],
    },
    {
      label: 'Msgs/min',
      value: metrics.messagesPerMinute,
      trend: '+12%',
      sparkline: [22, 30, 48, 52, 61, 68],
    },
    {
      label: 'Temp Rooms',
      value: metrics.tempRooms,
      trend: '+3%',
      sparkline: [15, 24, 30, 30, 36, 42],
    },
    {
      label: 'Spam Alerts',
      value: metrics.spamAlerts,
      trend: '-1%',
      sparkline: [55, 44, 39, 28, 24, 19],
    },
  ]

  const handleRangeChange = (nextRange) => {
    setRefreshing(true)
    setRange(nextRange)
    window.setTimeout(() => setRefreshing(false), 260)
  }

  return (
    <div className="app-page flex min-h-screen">
      <aside className="app-surface w-64 border-r p-4">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">IntraLink Admin</h1>
        <nav className="space-y-2 text-sm">
          <Link to="/admin/dashboard" className="block rounded-md border border-slate-200 px-3 py-2">
            📊 Analytics
          </Link>
          <Link to="/admin/moderation" className="block rounded-md border border-slate-200 px-3 py-2">
            🛡 Moderation
          </Link>
          <Link to="/admin/audit-log" className="block rounded-md border border-slate-200 px-3 py-2">
            📋 Audit Log
          </Link>
          <Link to="/admin/temp-rooms" className="block rounded-md border border-slate-200 px-3 py-2">
            ⏳ Temp Rooms
          </Link>
          <Link to="/admin/whitelist" className="block rounded-md border border-slate-200 px-3 py-2">
            📋 Whitelist
          </Link>
          <Link to="/chat" className="block rounded-md border border-slate-200 px-3 py-2">
            ← Back to Chat
          </Link>
        </nav>
      </aside>

      <main className="flex-1 space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Analytics Dashboard</h2>
            <p className="text-sm text-slate-500">Live workspace metrics, moderation pressure, and temp room activity.</p>
          </div>
          <div className="flex gap-2">
            {['today', '7d', '30d'].map((option) => (
              <Button
                key={option}
                variant={range === option ? 'primary' : 'secondary'}
                className="text-xs"
                onClick={() => handleRangeChange(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {refreshing ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <SkeletonBlock className="mb-3 h-4 w-32" />
              <SkeletonBlock className="h-56 w-full" />
            </div>
          ) : (
            <ActivityChart data={chartData} />
          )}
          <SpamFeed items={moderationQueue} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ActivityHeatmap values={heatmapValues} />

          <div className="rounded-lg border border-slate-200 bg-white p-3 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Quick Actions</h3>
              <span className="text-xs text-slate-500">Admin shortcuts</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Link to="/admin/audit-log" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Audit Timeline</p>
                <p className="mt-1 text-xs text-slate-500">Inspect live events and anomaly spikes.</p>
              </Link>
              <Link to="/admin/moderation" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Moderation Queue</p>
                <p className="mt-1 text-xs text-slate-500">Filter, inspect, and resolve flagged activity.</p>
              </Link>
              <Link to="/admin/temp-rooms" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Temp Room Policies</p>
                <p className="mt-1 text-xs text-slate-500">Watch countdowns and enforce lifecycle rules.</p>
              </Link>
              <button 
                onClick={handleToggleLockdown}
                className={`rounded-lg border p-3 text-left transition-colors ${lockdownActive ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${lockdownActive ? 'text-red-700' : 'text-slate-900'}`}>
                    {lockdownActive ? 'Disable Lockdown' : 'Enable Lockdown'}
                  </p>
                  <div className={`h-2.5 w-2.5 rounded-full ${lockdownActive ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                <p className={`mt-1 text-xs ${lockdownActive ? 'text-red-600' : 'text-slate-500'}`}>
                  {lockdownActive 
                    ? 'System locked down. Only admin actions permitted.'
                    : 'Emergency mode to halt all messaging instantly.'}
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-3 xl:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-red-800">Danger Zone</h3>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowBlastModal(true)}
                className="rounded-lg border border-red-300 bg-white p-3 text-left transition-colors hover:bg-red-100"
              >
                <p className="text-sm font-semibold text-red-700">💥 Blast Org</p>
                <p className="mt-1 text-xs text-red-600">Encrypt everything to blueprint.inm & wipe live data.</p>
              </button>
              <button 
                onClick={() => setShowRestoreModal(true)}
                className="rounded-lg border border-red-300 bg-white p-3 text-left transition-colors hover:bg-red-100"
              >
                <p className="text-sm font-semibold text-red-700">📥 Restore Blueprint</p>
                <p className="mt-1 text-xs text-red-600">Import an encrypted blueprint.inm to restore config.</p>
              </button>
            </div>
          </div>
        </section>

        <AssignManagerWidget />

        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Top Activity Areas</h3>
            <span className="text-xs text-slate-500">Derived from frontend demo metrics</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { label: '#general', detail: 'Highest unread volume and thread churn.' },
              { label: '#engineering', detail: 'Strong reaction density and review traffic.' },
              { label: '#incident-war-room', detail: 'Time-boxed room with urgent coordination.' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <BlastModal open={showBlastModal} onClose={() => setShowBlastModal(false)} onConfirm={handleBlastExecute} />
      <RestoreModal open={showRestoreModal} onClose={() => setShowRestoreModal(false)} onConfirm={handleRestoreExecute} />
    </div>
  )
}

export default DashboardPage
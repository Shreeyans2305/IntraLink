import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchRooms } from '../../features/messaging/messagingApi'
import { useAuth } from '../../features/auth/useAuth'

export default function ManagerDashboardPage() {
  const { auth } = useAuth()
  const user = auth?.user
  const { data: rooms = [], isLoading } = useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })

  // Find all rooms where this user is either an admin or specifically assigned as a room_manager
  const managedRooms = rooms.filter(room => 
    user?.org_role === 'admin' || 
    room.members?.some(m => m.user_id === user?.id && m.room_role === 'room_manager')
  )

  return (
    <div className="app-page bg-zinc-950 text-zinc-200 flex min-h-screen">
      <aside className="app-surface bg-zinc-900/20 w-64 border-r p-4">
        <h1 className="mb-4 text-lg font-semibold text-zinc-100">Manager Dashboard</h1>
        <nav className="space-y-2 text-sm">
          <Link to="/manager/dashboard" className="block rounded-md border border-slate-900 bg-zinc-950 text-white px-3 py-2">
            📊 Managed Rooms
          </Link>
          <Link to="/chat" className="block rounded-md border border-zinc-800 px-3 py-2">
            ← Back to Chat
          </Link>
        </nav>
      </aside>

      <main className="flex-1 space-y-4 p-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Room Manager Dashboard</h2>
          <p className="text-sm text-zinc-400">Overview of the specific channels you manage.</p>
        </div>

        {isLoading ? (
          <div className="p-4">Loading your managed rooms...</div>
        ) : managedRooms.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {managedRooms.map(room => (
              <div key={room.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-zinc-200">#{room.name}</h3>
                  <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-medium">
                    {room.members?.length || 0} Members
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-4 truncate">
                  {room.description || "No description set."}
                </p>
                <div className="flex justify-between items-center text-xs">
                  <Link to="/chat" className="text-cyan-600 hover:text-cyan-700 font-medium">
                    Open in Chat →
                  </Link>
                  <span className="text-zinc-400">
                    {room.archived ? 'Archived' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-400">
            You do not currently manage any rooms.
          </div>
        )}
      </main>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { X, UserPlus, Shield, UserMinus, MicOff, Mic } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUsers, addRoomMember, kickRoomMember, updateRoomMember, muteMember, unmuteMember } from '../../features/messaging/messagingApi'

export default function ManageMembersModal({ open, onClose, room, currentUser, onMembersChanged }) {
  const queryClient = useQueryClient()
  const [newUserId, setNewUserId] = useState('')
  const [newUserRole, setNewUserRole] = useState('user')

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: open,
  })

  // Invalidate room data helper
  const refreshRooms = () => {
    queryClient.invalidateQueries(['rooms'])
    if (onMembersChanged) onMembersChanged()
  }

  // Mutations
  const addMutation = useMutation({
    mutationFn: () => addRoomMember(room.id, { user_id: newUserId, room_role: newUserRole }),
    onSuccess: () => {
      refreshRooms()
      setNewUserId('')
    },
    onError: (err) => alert(err.response?.data?.detail || 'Failed to add member')
  })

  const kickMutation = useMutation({
    mutationFn: (userId) => kickRoomMember(room.id, userId),
    onSuccess: refreshRooms,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to kick member')
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateRoomMember(room.id, userId, { room_role: role }),
    onSuccess: refreshRooms,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to update role')
  })

  const muteMutation = useMutation({
    mutationFn: (userId) => muteMember(room.id, userId),
    onSuccess: refreshRooms,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to mute member')
  })

  const unmuteMutation = useMutation({
    mutationFn: (userId) => unmuteMember(room.id, userId),
    onSuccess: refreshRooms,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to unmute member')
  })

  const memberIds = useMemo(() => room?.members?.map(m => m.user_id) || [], [room])
  const availableUsers = useMemo(() => users.filter(u => !memberIds.includes(u.id)), [users, memberIds])

  if (!open || !room) return null

  const isCurrentUserAdmin = currentUser?.org_role === 'admin'
  const isCurrentUserRoomManager = room.members?.find(m => m.user_id === currentUser?.id)?.room_role === 'room_manager'
  const canManage = isCurrentUserAdmin || isCurrentUserRoomManager

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Manage #{room.name}</h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-brand-400 transition-colors">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          
          {canManage && (
            <div className="mb-6 rounded-xl bg-zinc-900/40 p-3 border border-zinc-800">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Add Member</h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs text-zinc-400">Select User</label>
                  <select
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                  >
                    <option value="">-- Choose User --</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="mb-1 block text-xs text-zinc-400">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                  >
                    <option value="user">User</option>
                    <option value="room_manager">Manager</option>
                  </select>
                </div>
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={!newUserId || addMutation.isPending}
                  className="rounded-md bg-brand-500 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-brand-400 disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                >
                  <UserPlus size={16} />
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Current Members ({room.members?.length || 0})</h3>
            <div className="space-y-2">
              {room.members?.map(member => {
                const userObj = users.find(u => u.id === member.user_id)
                const isSelf = currentUser?.id === member.user_id
                
                return (
                  <div key={member.user_id} className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors p-2 text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        {userObj ? userObj.name : 'Unknown User'}
                        {isSelf && <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">You</span>}
                      </span>
                      <span className="text-xs text-zinc-500">{userObj?.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.room_role === 'room_manager' && (
                        <span className="flex items-center gap-1 text-[10px] uppercase text-brand-400 font-semibold bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded">
                          <Shield size={10} /> Manager
                        </span>
                      )}
                      
                      {member.muted && (
                        <span className="flex items-center gap-1 text-[10px] uppercase text-red-400 font-semibold bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded">
                          <MicOff size={10} /> Muted
                        </span>
                      )}

                      {canManage && !isSelf && (
                        <div className="ml-3 flex items-center gap-1">
                          
                          <select
                            value={member.room_role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: member.user_id, role: e.target.value })}
                            className="bg-zinc-950 border border-zinc-700 text-xs rounded px-1 py-1 text-zinc-300 outline-none hover:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="room_manager">Manager</option>
                          </select>

                          <button 
                            onClick={() => member.muted ? unmuteMutation.mutate(member.user_id) : muteMutation.mutate(member.user_id)}
                            title={member.muted ? "Unmute user" : "Mute user"}
                            className={`p-1.5 rounded transition-colors ${member.muted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
                          >
                            {member.muted ? <Mic size={12} /> : <MicOff size={12} />}
                          </button>

                          <button 
                            onClick={() => {
                              if (window.confirm('Remove this user from the room?')) {
                                kickMutation.mutate(member.user_id)
                              }
                            }}
                            title="Kick user"
                            className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          >
                            <UserMinus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

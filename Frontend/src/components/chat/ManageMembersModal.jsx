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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
        <header className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Manage #{room.name}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          
          {canManage && (
            <div className="mb-6 rounded-lg bg-black/20 p-3 border border-white/5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Add Member</h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs text-slate-400">Select User</label>
                  <select
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">-- Choose User --</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="mb-1 block text-xs text-slate-400">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="room_manager">Manager</option>
                  </select>
                </div>
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={!newUserId || addMutation.isPending}
                  className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  <UserPlus size={16} />
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Current Members ({room.members?.length || 0})</h3>
            <div className="space-y-2">
              {room.members?.map(member => {
                const userObj = users.find(u => u.id === member.user_id)
                const isSelf = currentUser?.id === member.user_id
                
                return (
                  <div key={member.user_id} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/50 p-2 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-white flex items-center gap-1.5">
                        {userObj ? userObj.name : 'Unknown User'}
                        {isSelf && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">You</span>}
                      </span>
                      <span className="text-xs text-slate-400">{userObj?.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.room_role === 'room_manager' && (
                        <span className="flex items-center gap-1 text-[10px] uppercase text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded">
                          <Shield size={10} /> Manager
                        </span>
                      )}
                      
                      {member.muted && (
                        <span className="flex items-center gap-1 text-[10px] uppercase text-red-400 font-semibold bg-red-400/10 px-1.5 py-0.5 rounded">
                          <MicOff size={10} /> Muted
                        </span>
                      )}

                      {canManage && !isSelf && (
                        <div className="ml-3 flex items-center gap-1">
                          
                          <select
                            value={member.room_role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: member.user_id, role: e.target.value })}
                            className="bg-slate-900 border border-white/10 text-xs rounded px-1 py-1 text-slate-300 outline-none hover:border-cyan-500 transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="room_manager">Manager</option>
                          </select>

                          <button 
                            onClick={() => member.muted ? unmuteMutation.mutate(member.user_id) : muteMutation.mutate(member.user_id)}
                            title={member.muted ? "Unmute user" : "Mute user"}
                            className={`p-1.5 rounded transition-colors ${member.muted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
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
                            className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
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

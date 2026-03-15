import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRoom } from '../../features/messaging/messagingApi'

export default function CreateRoomModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createRoom,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['rooms'])
      onCreated?.(data.id)
      onClose()
      setName('')
      setDescription('')
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to create room')
    }
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Create New Channel</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. general"
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-white/5 bg-slate-800/50 p-4">
          <button 
            type="button" 
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button 
            type="button" 
            disabled={!name.trim() || isPending}
            onClick={() => mutate({ name: name.trim(), description: description.trim(), type: 'standard' })}
            className="flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            <Plus size={14} />
            Create Channel
          </button>
        </footer>
      </div>
    </div>
  )
}

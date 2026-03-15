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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Create New Channel</h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-brand-400 transition-colors">
            <X size={16} />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. general"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-zinc-800 bg-zinc-900/30 p-4">
          <button 
            type="button" 
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            disabled={!name.trim() || isPending}
            onClick={() => mutate({ name: name.trim(), description: description.trim(), type: 'standard' })}
            className="flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1.5 text-sm font-bold text-zinc-950 hover:bg-brand-400 disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all"
          >
            <Plus size={14} />
            Create Channel
          </button>
        </footer>
      </div>
    </div>
  )
}

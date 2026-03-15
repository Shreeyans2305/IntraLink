import { useState } from 'react'
import { presenceStatusOptions } from '../../features/presence/statusUtils'
import Button from '../ui/Button'

function StatusPicker({ status, onStatusChange, onCustomStatusChange }) {
  const [customText, setCustomText] = useState('')

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <label className="block text-xs font-medium text-zinc-400">Presence</label>
      <select
        className="w-full rounded-md border border-zinc-700 bg-zinc-900/40 px-2 py-2 text-sm"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        {presenceStatusOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900/40 text-zinc-100 px-2 py-2 text-sm"
          value={customText}
          onChange={(event) => setCustomText(event.target.value)}
          placeholder="Custom status + emoji"
        />
        <Button
          variant="secondary"
          onClick={() => onCustomStatusChange(customText)}
          className="whitespace-nowrap"
        >
          Set
        </Button>
      </div>
    </div>
  )
}

export default StatusPicker
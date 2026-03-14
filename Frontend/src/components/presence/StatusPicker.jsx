import { useState } from 'react'
import { presenceStatusOptions } from '../../features/presence/statusUtils'
import Button from '../ui/Button'

function StatusPicker({ status, onStatusChange, onCustomStatusChange }) {
  const [customText, setCustomText] = useState('')

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      <label className="block text-xs font-medium text-slate-600">Presence</label>
      <select
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
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
          className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
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
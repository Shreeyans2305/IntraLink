import { useState } from 'react'
import Button from '../ui/Button'

function ThreadInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    const value = text.trim()
    if (!value) {
      return
    }
    onSend(value)
    setText('')
  }

  return (
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <textarea
        value={text}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        className="h-20 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
        placeholder="Reply in thread"
      />
      <Button disabled={disabled} onClick={handleSend}>
        Reply
      </Button>
    </div>
  )
}

export default ThreadInput
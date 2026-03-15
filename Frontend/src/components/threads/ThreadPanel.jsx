import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import ThreadInput from './ThreadInput'
import ThreadMessage from './ThreadMessage'
import MarkdownText from '../ui/MarkdownText'

function ThreadPanel({ open, parentMessage, items, onClose, onReply, disabled }) {
  if (!open || !parentMessage) {
    return null
  }

  return (
    <aside className="h-full w-full border-l border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Thread</p>
          <div className="text-sm font-semibold text-slate-800"><MarkdownText text={parentMessage.text} /></div>
        </div>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mb-3 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '55vh' }}>
        {items.length ? (
          items.map((item) => <ThreadMessage key={item.id} item={item} />)
        ) : (
          <EmptyState
            title="No replies yet"
            description="Start the thread to keep side discussions out of the main channel."
          />
        )}
      </div>

      <ThreadInput disabled={disabled} onSend={onReply} />
    </aside>
  )
}

export default ThreadPanel
import Modal from './Modal'

function ShortcutModal({ open, onClose }) {
  const shortcuts = [
    { keys: 'Ctrl/Cmd + K', action: 'Open command palette' },
    { keys: 'Ctrl/Cmd + Shift + F', action: 'Open global search' },
    { keys: '?', action: 'Open keyboard shortcuts' },
    { keys: 'Enter', action: 'Send message from composer' },
    { keys: 'Arrow Up/Down', action: 'Navigate command suggestions' },
    { keys: 'Escape', action: 'Close overlays and dialogs' },
  ]

  return (
    <Modal open={open} title="Keyboard Shortcuts" onClose={onClose}>
      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.keys}
            className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm"
          >
            <span className="font-medium text-zinc-200">{shortcut.action}</span>
            <kbd className="rounded bg-zinc-900/40 px-2 py-1 text-xs text-zinc-400">{shortcut.keys}</kbd>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default ShortcutModal
import { useEffect, useMemo, useState } from 'react'

function CommandPalette({ open, items, recentCommands = [], onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const handleClose = () => {
    setQuery('')
    setActiveIndex(0)
    onClose()
  }

  const filteredItems = useMemo(() => {
    const baseItems = items.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()),
    )

    if (!query && recentCommands.length) {
      return [
        ...recentCommands.map((command, index) => ({
          id: `recent-${index}`,
          label: command,
          description: 'Recent command',
          value: command,
        })),
        ...baseItems,
      ]
    }

    return baseItems
  }, [items, query, recentCommands])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((value) => Math.min(value + 1, Math.max(filteredItems.length - 1, 0)))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((value) => Math.max(value - 1, 0))
      }

      if (event.key === 'Enter' && filteredItems[activeIndex]) {
        event.preventDefault()
        onSelect(filteredItems[activeIndex])
      }

      if (event.key === 'Escape') {
        setQuery('')
        setActiveIndex(0)
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, filteredItems, onClose, onSelect, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 p-4" onClick={handleClose}>
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 p-4">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Run command, jump to room, or navigate"
            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
          />
        </div>
        <div className="max-h-[22rem] overflow-y-auto p-3">
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setQuery('')
                setActiveIndex(0)
                onSelect(item)
              }}
              className={`block w-full rounded-lg px-3 py-3 text-left ${
                activeIndex === index ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className={`text-xs ${activeIndex === index ? 'text-slate-300' : 'text-slate-500'}`}>
                    {item.description}
                  </p>
                </div>
                {item.shortcut ? <kbd className="text-[11px] opacity-70">{item.shortcut}</kbd> : null}
              </div>
            </button>
          ))}
          {!filteredItems.length ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-500">
              No matching actions.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
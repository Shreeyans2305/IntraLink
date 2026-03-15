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
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-zinc-800 p-4">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Run command, jump to room, or navigate"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/40 text-zinc-100 px-3 py-3 text-sm placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
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
                activeIndex === index ? 'bg-zinc-950 text-white' : 'hover:bg-zinc-800/40 transition-colors'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className={`text-xs ${activeIndex === index ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    {item.description}
                  </p>
                </div>
                {item.shortcut ? <kbd className="text-[11px] opacity-70">{item.shortcut}</kbd> : null}
              </div>
            </button>
          ))}
          {!filteredItems.length ? (
            <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-8 text-center text-sm text-zinc-400">
              No matching actions.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
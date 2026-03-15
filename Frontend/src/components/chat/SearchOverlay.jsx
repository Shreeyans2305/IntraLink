function highlight(label, query) {
  if (!query) {
    return label
  }

  const parts = label.split(new RegExp(`(${query})`, 'ig'))
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-500/30 px-0.5 text-amber-200">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

function ResultSection({ title, items, onSelect, query }) {
  if (!items.length) {
    return null
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-left hover:bg-zinc-800/40 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-200">{highlight(item.label, query)}</p>
            {item.meta ? <p className="mt-1 text-xs text-zinc-400">{item.meta}</p> : null}
          </button>
        ))}
      </div>
    </section>
  )
}

function SearchOverlay({ open, query, onQueryChange, results, onClose, onSelect }) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30 p-4" onClick={onClose}>
      <div
        className="mx-auto max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-zinc-800 bg-zinc-900/40 p-4">
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search rooms, messages, bookmarks, people"
            className="w-full rounded-lg border border-zinc-700 px-3 py-3 text-sm"
          />
        </div>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4">
          <ResultSection title="Rooms" items={results.rooms} onSelect={onSelect} query={query} />
          <ResultSection title="Messages" items={results.messages} onSelect={onSelect} query={query} />
          <ResultSection title="Bookmarks" items={results.bookmarks} onSelect={onSelect} query={query} />
          <ResultSection title="People" items={results.people} onSelect={onSelect} query={query} />
          {!results.rooms.length &&
          !results.messages.length &&
          !results.bookmarks.length &&
          !results.people.length ? (
            <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
              No global results yet. Try another keyword.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SearchOverlay
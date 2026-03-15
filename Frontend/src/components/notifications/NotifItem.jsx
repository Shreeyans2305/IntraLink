function NotifItem({ item, onRead }) {
  return (
    <button
      className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
        item.read ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400' : 'border-brand-500/20 bg-brand-500/10 text-zinc-200'
      }`}
      onClick={() => onRead(item.id)}
      type="button"
    >
      <div className="mb-1 text-xs font-semibold text-zinc-400">{item.type}</div>
      <p>{item.text}</p>
    </button>
  )
}

export default NotifItem
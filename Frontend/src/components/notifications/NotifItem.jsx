function NotifItem({ item, onRead }) {
  return (
    <button
      className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
        item.read ? 'border-slate-200 bg-white text-slate-500' : 'border-blue-200 bg-blue-50 text-slate-800'
      }`}
      onClick={() => onRead(item.id)}
      type="button"
    >
      <div className="mb-1 text-xs font-semibold text-slate-600">{item.type}</div>
      <p>{item.text}</p>
    </button>
  )
}

export default NotifItem
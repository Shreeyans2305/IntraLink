function Toast({ message, type = 'info' }) {
  if (!message) {
    return null
  }

  const typeClass = {
    info: 'bg-slate-900 text-white',
    warning: 'bg-amber-500 text-slate-900',
    error: 'bg-red-600 text-white',
  }[type]

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-md px-3 py-2 text-sm ${typeClass}`}>
      {message}
    </div>
  )
}

export default Toast
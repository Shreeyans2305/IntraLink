import Button from './Button'

function Modal({ open, title, children, onClose }) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <Button variant="ghost" className="px-2 py-1" onClick={onClose}>
            Close
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

export default Modal
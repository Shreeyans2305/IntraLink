import { groupNotifs } from '../../utils/notifUtils/groupNotifs'
import Button from '../ui/Button'
import NotifItem from './NotifItem'

function NotificationCenter({ items, onRead, onReadAll, onClose }) {
  const grouped = groupNotifs(items)

  return (
    <aside className="absolute right-4 top-14 z-40 w-[360px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Notification Center</h3>
        <div className="flex gap-1">
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onReadAll}>
            Mark all read
          </Button>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {Object.keys(grouped).map((type) => (
          <section key={type} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{type}</h4>
            <div className="space-y-2">
              {grouped[type].map((item) => (
                <NotifItem key={item.id} item={item} onRead={onRead} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  )
}

export default NotificationCenter
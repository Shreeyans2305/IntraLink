import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useAdmin } from '../../features/admin/useAdmin'

function ModerationPage() {
  const { moderationQueue, resolveModeration } = useAdmin()
  const [severityFilter, setSeverityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(moderationQueue[0]?.id ?? null)

  const filteredQueue = useMemo(
    () =>
      moderationQueue.filter((item) => {
        const severityMatches = severityFilter === 'all' ? true : item.severity === severityFilter
        const searchMatches = search ? item.user.toLowerCase().includes(search.toLowerCase()) : true
        return severityMatches && searchMatches
      }),
    [moderationQueue, search, severityFilter],
  )

  const selectedItem = filteredQueue.find((item) => item.id === selectedId) ?? filteredQueue[0] ?? null

  return (
    <main className="app-page min-h-screen p-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Moderation Tools</h1>
        <Link to="/admin/dashboard" className="text-sm font-medium text-slate-700 underline">
          Back to Dashboard
        </Link>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by user"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={severityFilter}
          onChange={(event) => setSeverityFilter(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All severities</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 md:col-span-2">
          {filteredQueue.length} queued item(s) visible
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {filteredQueue.length ? (
            filteredQueue.map((item) => (
              <article
                key={item.id}
                className={`cursor-pointer rounded-lg border p-4 ${
                  selectedItem?.id === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.user}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      selectedItem?.id === item.id
                        ? 'bg-white/15 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
                <p className={`mb-3 text-sm ${selectedItem?.id === item.id ? 'text-slate-200' : 'text-slate-600'}`}>
                  {item.reason}
                </p>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => resolveModeration(item.id)}>
                    Remove
                  </Button>
                  <Button variant="secondary" onClick={() => resolveModeration(item.id)}>
                    Mark safe
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No moderation items"
              description="The queue is clear. Adjust filters or wait for new flags to appear."
            />
          )}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          {selectedItem ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Review Panel</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {selectedItem.severity}
                </span>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">User</p>
                  <p>{selectedItem.user}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Reason</p>
                  <p>{selectedItem.reason}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sample Transcript</p>
                  <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                    Multiple identical outbound messages were detected within 20 seconds, plus repeated link patterns.
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Recommended Actions</p>
                  <ul className="list-disc pl-5">
                    <li>Mute user for 10 minutes if repetition continues.</li>
                    <li>Require moderator review before restoring posting rights.</li>
                    <li>Capture message samples in the audit log timeline.</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No item selected"
              description="Choose a moderation item to inspect the detailed review panel."
            />
          )}
        </aside>
      </section>
    </main>
  )
}

export default ModerationPage
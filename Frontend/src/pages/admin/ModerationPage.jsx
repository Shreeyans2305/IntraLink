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
    <main className="app-page bg-zinc-950 text-zinc-200 min-h-screen p-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Moderation Tools</h1>
        <Link to="/admin/dashboard" className="text-sm font-medium text-zinc-300 underline">
          Back to Dashboard
        </Link>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by user"
          className="rounded-md border border-zinc-700 bg-zinc-900/40 text-zinc-100 px-3 py-2 text-sm"
        />
        <select
          value={severityFilter}
          onChange={(event) => setSeverityFilter(event.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900/40 text-zinc-100 px-3 py-2 text-sm"
        >
          <option value="all">All severities</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
        <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-400 md:col-span-2">
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
                  selectedItem?.id === item.id ? 'border-slate-900 bg-zinc-950 text-white' : 'border-zinc-800 bg-zinc-900/40'
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.user}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      selectedItem?.id === item.id
                        ? 'bg-white/15 text-white'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
                <p className={`mb-3 text-sm ${selectedItem?.id === item.id ? 'text-zinc-200' : 'text-zinc-400'}`}>
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

        <aside className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          {selectedItem ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-100">Review Panel</h2>
                <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                  {selectedItem.severity}
                </span>
              </div>
              <div className="space-y-3 text-sm text-zinc-400">
                <div>
                  <p className="font-semibold text-zinc-100">User</p>
                  <p>{selectedItem.user}</p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Reason</p>
                  <p>{selectedItem.reason}</p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Sample Transcript</p>
                  <div className="rounded-lg bg-zinc-900/60 p-3 text-xs leading-5 text-zinc-400">
                    Multiple identical outbound messages were detected within 20 seconds, plus repeated link patterns.
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Recommended Actions</p>
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
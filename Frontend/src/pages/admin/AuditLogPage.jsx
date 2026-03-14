import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { addAuditLog, selectAdminState } from '../../features/admin/adminSlice'
import { exportAuditLogsCsv, startAuditLogStream } from '../../services/auditService'

function downloadCsv(contents) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.setAttribute('download', 'intralink-audit-log.csv')
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function AuditLogPage() {
  const dispatch = useDispatch()
  const { auditLogs } = useSelector(selectAdminState)

  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [datePreset, setDatePreset] = useState('all')
  const [streaming, setStreaming] = useState(false)
  const [stopStream, setStopStream] = useState(null)

  const filteredLogs = useMemo(() => {
    const referenceTime = auditLogs[0]?.timestamp ?? 0
    const cutoff = {
      all: 0,
      '15m': referenceTime - 1000 * 60 * 15,
      '1h': referenceTime - 1000 * 60 * 60,
      '24h': referenceTime - 1000 * 60 * 60 * 24,
    }[datePreset]

    return auditLogs.filter((log) => {
      const userMatches = filterUser ? log.user.toLowerCase().includes(filterUser.toLowerCase()) : true
      const actionMatches = filterAction
        ? log.action.toLowerCase().includes(filterAction.toLowerCase())
        : true
      const dateMatches = cutoff ? log.timestamp >= cutoff : true
      return userMatches && actionMatches && dateMatches
    })
  }, [auditLogs, datePreset, filterAction, filterUser])

  useEffect(() => {
    return () => {
      stopStream?.()
    }
  }, [stopStream])

  const handleStartStream = () => {
    if (streaming) {
      return
    }

    const stop = startAuditLogStream((entry) => {
      dispatch(addAuditLog(entry))
    })

    setStreaming(true)
    setStopStream(() => stop)
  }

  const handleStopStream = () => {
    stopStream?.()
    setStreaming(false)
    setStopStream(null)
  }

  const handleExport = () => {
    downloadCsv(exportAuditLogsCsv(filteredLogs))
  }

  return (
    <main className="app-page min-h-screen p-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Audit Log Viewer</h1>
        <Link to="/admin/dashboard" className="text-sm font-medium text-slate-700 underline">
          Back to Dashboard
        </Link>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-6">
        <input
          value={filterUser}
          onChange={(event) => setFilterUser(event.target.value)}
          placeholder="Filter by user"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={filterAction}
          onChange={(event) => setFilterAction(event.target.value)}
          placeholder="Filter by action"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={datePreset}
          onChange={(event) => setDatePreset(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All time</option>
          <option value="15m">Last 15m</option>
          <option value="1h">Last 1h</option>
          <option value="24h">Last 24h</option>
        </select>
        <Button variant="secondary" onClick={() => setViewMode((current) => (current === 'table' ? 'timeline' : 'table'))}>
          {viewMode === 'table' ? 'Timeline View' : 'Table View'}
        </Button>
        <Button variant="secondary" onClick={streaming ? handleStopStream : handleStartStream}>
          {streaming ? 'Stop Stream' : 'Start Stream'}
        </Button>
        <Button onClick={handleExport}>Export CSV</Button>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-wide text-slate-500">Visible Entries</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{filteredLogs.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-wide text-slate-500">Anomalies</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {filteredLogs.filter((log) => log.anomaly).length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-wide text-slate-500">Streaming</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{streaming ? 'Live' : 'Idle'}</p>
        </div>
      </section>

      {viewMode === 'table' ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Details</th>
                <th className="px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={log.anomaly ? 'bg-amber-50' : 'border-t border-slate-100'}
                  title={log.anomaly ? 'Anomaly highlighted' : ''}
                >
                  <td className="px-3 py-2">{log.user}</td>
                  <td className="px-3 py-2">{log.action}</td>
                  <td className="px-3 py-2">{log.detail}</td>
                  <td className="px-3 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="space-y-3">
          {filteredLogs.map((log) => (
            <article
              key={log.id}
              className={`rounded-lg border p-4 ${
                log.anomaly ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-500">{log.user}</p>
                </div>
                <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-600">{log.detail}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default AuditLogPage
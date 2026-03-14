import PresenceDot from './PresenceDot'

function StatusIndicator({ status, customStatus }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700">
      <PresenceDot status={status} />
      <span>{status}</span>
      {customStatus ? <span className="text-slate-500">• {customStatus}</span> : null}
    </div>
  )
}

export default StatusIndicator
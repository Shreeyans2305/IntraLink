import PresenceDot from './PresenceDot'

function StatusIndicator({ status, customStatus }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-300">
      <PresenceDot status={status} />
      <span>{status}</span>
      {customStatus ? <span className="text-zinc-400">• {customStatus}</span> : null}
    </div>
  )
}

export default StatusIndicator
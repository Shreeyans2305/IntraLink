import { statusColorByType } from '../../features/presence/statusUtils'

function PresenceDot({ status }) {
  return (
    <span
      className={`inline-flex h-2.5 w-2.5 rounded-full ${
        statusColorByType[status] ?? 'bg-slate-500'
      }`}
      aria-label={status}
    />
  )
}

export default PresenceDot
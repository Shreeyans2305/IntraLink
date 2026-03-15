import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../features/auth/authSlice'
import Button from '../ui/Button'
import PollResults from './PollResults'

function PollCard({ poll, onVote }) {
  const currentUser = useSelector(selectCurrentUser)
  const hasVoted = poll.options.some((opt) => opt.voters?.includes(currentUser?.id))
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-800">📊 {poll.question}</h4>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          {poll.anonymous ? <span className="rounded-full bg-slate-100 px-2 py-1">Anonymous</span> : null}
          {poll.closeAt ? (
            <span className="rounded-full bg-slate-100 px-2 py-1">
              Closes {new Date(poll.closeAt).toLocaleString()}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {poll.options.map((option) => (
          <Button
            key={option.id}
            variant={hasVoted ? 'ghost' : 'secondary'}
            className={`text-xs ${hasVoted && option.voters?.includes(currentUser?.id) ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}
            disabled={poll.closed || hasVoted}
            onClick={() => onVote(poll.id, option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <PollResults options={poll.options} />
      {poll.closed ? <p className="mt-2 text-xs text-slate-500">Poll closed</p> : null}
    </div>
  )
}

export default PollCard
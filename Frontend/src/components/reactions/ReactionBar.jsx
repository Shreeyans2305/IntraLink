import ReactionTooltip from './ReactionTooltip'

function ReactionBar({ reactions = {}, onReact }) {
  const entries = Object.entries(reactions)

  if (!entries.length) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {entries.map(([emoji, users]) => (
        <button
          key={emoji}
          type="button"
          className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
          onClick={() => onReact(emoji)}
        >
          <span>{emoji}</span>
          <span>{users.length}</span>
          <span className="hidden group-hover:block">
            <ReactionTooltip users={users} />
          </span>
        </button>
      ))}
    </div>
  )
}

export default ReactionBar
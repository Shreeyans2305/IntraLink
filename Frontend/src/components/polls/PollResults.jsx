function PollResults({ options }) {
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0)

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const percent = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0
        return (
          <div key={option.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{option.label}</span>
              <span>
                {option.votes} votes ({percent}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PollResults
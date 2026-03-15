function ReactionTooltip({ users }) {
  if (!users?.length) {
    return null
  }

  return <span className="text-[11px] text-zinc-400">{users.join(', ')}</span>
}

export default ReactionTooltip
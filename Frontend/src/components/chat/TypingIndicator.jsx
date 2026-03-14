function TypingIndicator({ users }) {
  if (!users?.length) {
    return null
  }

  return (
    <p className="px-1 text-xs text-slate-500">
      {users.join(', ')} {users.length > 1 ? 'are' : 'is'} typing...
    </p>
  )
}

export default TypingIndicator
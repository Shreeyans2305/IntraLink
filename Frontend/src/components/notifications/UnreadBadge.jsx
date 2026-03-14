function UnreadBadge({ count }) {
  if (!count) {
    return null
  }

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
      {count}
    </span>
  )
}

export default UnreadBadge
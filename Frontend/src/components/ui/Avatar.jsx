function initials(name) {
  if (!name) {
    return 'U'
  }
  const [first = '', second = ''] = name.split(' ')
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || name.slice(0, 1).toUpperCase()
}

function Avatar({ name, size = 'md' }) {
  const sizeClass = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  }[size]

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 shadow-[inset_0_1px_rgba(255,255,255,0.05)] font-semibold text-brand-400 ${sizeClass}`}
      aria-label={name}
    >
      {initials(name)}
    </div>
  )
}

export default Avatar
function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) {
  const variantClass = {
    primary: 'bg-brand-600 text-white hover:bg-brand-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-brand-500/30',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30',
    ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
  }[variant]

  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${variantClass} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
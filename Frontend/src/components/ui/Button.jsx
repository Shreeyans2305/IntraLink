function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) {
  const variantClass = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  }[variant]

  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${variantClass} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
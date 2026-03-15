function SidebarSection({ title, count, collapsed, onToggle, actions, children }) {
  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-center justify-between text-left group"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 group-hover:text-brand-400 transition-colors">
          {title} {typeof count === 'number' ? `(${count})` : ''}
        </span>
        <span className="text-xs text-zinc-500 group-hover:text-brand-500/80 transition-colors cursor-pointer">{collapsed ? 'Show' : 'Hide'}</span>
      </button>
      {actions ? <div className="mb-2">{actions}</div> : null}
      {!collapsed ? children : null}
    </section>
  )
}

export default SidebarSection
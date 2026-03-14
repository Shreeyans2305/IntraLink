function SidebarSection({ title, count, collapsed, onToggle, actions, children }) {
  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-center justify-between text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title} {typeof count === 'number' ? `(${count})` : ''}
        </span>
        <span className="text-xs text-slate-400">{collapsed ? 'Show' : 'Hide'}</span>
      </button>
      {actions ? <div className="mb-2">{actions}</div> : null}
      {!collapsed ? children : null}
    </section>
  )
}

export default SidebarSection
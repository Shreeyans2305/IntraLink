function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-5 py-10 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default EmptyState
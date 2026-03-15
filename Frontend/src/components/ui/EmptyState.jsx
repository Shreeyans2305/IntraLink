function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700 bg-white/60 px-5 py-10 text-center">
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default EmptyState
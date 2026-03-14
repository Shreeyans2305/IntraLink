function SpamFeed({ items }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-800">Spam Feed</h3>
      <div className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm">
              <p className="font-medium text-amber-900">{item.user}</p>
              <p className="text-amber-800">{item.reason}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No active spam alerts.</p>
        )}
      </div>
    </div>
  )
}

export default SpamFeed
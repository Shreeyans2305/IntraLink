function MetricCard({ label, value, trend, sparkline = [] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {trend ? (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {trend}
          </span>
        ) : null}
      </div>

      {sparkline.length ? (
        <div className="mt-3 flex h-10 items-end gap-1">
          {sparkline.map((point, index) => (
            <div
              key={`${label}-${index}`}
              className="flex-1 rounded-t bg-slate-300"
              style={{ height: `${Math.max(point, 12)}%` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default MetricCard
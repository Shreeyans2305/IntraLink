function ActivityHeatmap({ values }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Activity Heatmap</h3>
        <span className="text-xs text-zinc-400">Past 6 days</span>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {values.map((value, index) => (
          <div
            key={`heat-${index}`}
            className="rounded-md"
            style={{
              height: '54px',
              background: `rgba(59, 130, 246, ${Math.max(0.15, value / 100)})`,
            }}
            title={`Intensity ${value}`}
          />
        ))}
      </div>
    </div>
  )
}

export default ActivityHeatmap
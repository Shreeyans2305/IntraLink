function ActivityHeatmap({ values }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Activity Heatmap</h3>
        <span className="text-xs text-slate-500">Past 6 days</span>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {values.map((value, index) => (
          <div
            key={`heat-${index}`}
            className="rounded-md"
            style={{
              height: '54px',
              background: `rgba(15, 23, 42, ${Math.max(0.15, value / 100)})`,
            }}
            title={`Intensity ${value}`}
          />
        ))}
      </div>
    </div>
  )
}

export default ActivityHeatmap
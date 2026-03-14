import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function ActivityChart({ data }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-800">Activity Chart</h3>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="messages" stroke="#0f172a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ActivityChart
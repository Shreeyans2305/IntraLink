import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ActivityChart from '../../components/dashboard/ActivityChart'
import ActivityHeatmap from '../../components/dashboard/ActivityHeatmap'
import MetricCard from '../../components/dashboard/MetricCard'
import SpamFeed from '../../components/dashboard/SpamFeed'
import Button from '../../components/ui/Button'
import SkeletonBlock from '../../components/ui/SkeletonBlock'
import { useAdmin } from '../../features/admin/useAdmin'

function DashboardPage() {
  const { metrics, activitySeries, moderationQueue } = useAdmin()
  const [range, setRange] = useState('today')
  const [refreshing, setRefreshing] = useState(false)

  const scale = {
    today: 1,
    '7d': 1.18,
    '30d': 1.36,
  }[range]

  const chartData = useMemo(
    () =>
      activitySeries.map((item) => ({
        ...item,
        messages: Math.round(item.messages * scale),
      })),
    [activitySeries, scale],
  )

  const heatmapValues = useMemo(() => chartData.map((item) => item.messages), [chartData])

  const metricCards = [
    {
      label: 'Online',
      value: metrics.onlineUsers,
      trend: '+9%',
      sparkline: [24, 38, 40, 58, 62, 72],
    },
    {
      label: 'Msgs/min',
      value: metrics.messagesPerMinute,
      trend: '+12%',
      sparkline: [22, 30, 48, 52, 61, 68],
    },
    {
      label: 'Temp Rooms',
      value: metrics.tempRooms,
      trend: '+3%',
      sparkline: [15, 24, 30, 30, 36, 42],
    },
    {
      label: 'Spam Alerts',
      value: metrics.spamAlerts,
      trend: '-1%',
      sparkline: [55, 44, 39, 28, 24, 19],
    },
  ]

  const handleRangeChange = (nextRange) => {
    setRefreshing(true)
    setRange(nextRange)
    window.setTimeout(() => setRefreshing(false), 260)
  }

  return (
    <div className="app-page flex min-h-screen">
      <aside className="app-surface w-64 border-r p-4">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">IntraLink Admin</h1>
        <nav className="space-y-2 text-sm">
          <Link to="/admin/dashboard" className="block rounded-md border border-slate-200 px-3 py-2">
            📊 Analytics
          </Link>
          <Link to="/admin/moderation" className="block rounded-md border border-slate-200 px-3 py-2">
            🛡 Moderation
          </Link>
          <Link to="/admin/audit-log" className="block rounded-md border border-slate-200 px-3 py-2">
            📋 Audit Log
          </Link>
          <Link to="/admin/temp-rooms" className="block rounded-md border border-slate-200 px-3 py-2">
            ⏳ Temp Rooms
          </Link>
          <Link to="/chat" className="block rounded-md border border-slate-200 px-3 py-2">
            ← Back to Chat
          </Link>
        </nav>
      </aside>

      <main className="flex-1 space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Analytics Dashboard</h2>
            <p className="text-sm text-slate-500">Live workspace metrics, moderation pressure, and temp room activity.</p>
          </div>
          <div className="flex gap-2">
            {['today', '7d', '30d'].map((option) => (
              <Button
                key={option}
                variant={range === option ? 'primary' : 'secondary'}
                className="text-xs"
                onClick={() => handleRangeChange(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {refreshing ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <SkeletonBlock className="mb-3 h-4 w-32" />
              <SkeletonBlock className="h-56 w-full" />
            </div>
          ) : (
            <ActivityChart data={chartData} />
          )}
          <SpamFeed items={moderationQueue} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ActivityHeatmap values={heatmapValues} />

          <div className="rounded-lg border border-slate-200 bg-white p-3 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Quick Actions</h3>
              <span className="text-xs text-slate-500">Admin shortcuts</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Link to="/admin/audit-log" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Audit Timeline</p>
                <p className="mt-1 text-xs text-slate-500">Inspect live events and anomaly spikes.</p>
              </Link>
              <Link to="/admin/moderation" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Moderation Queue</p>
                <p className="mt-1 text-xs text-slate-500">Filter, inspect, and resolve flagged activity.</p>
              </Link>
              <Link to="/admin/temp-rooms" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Temp Room Policies</p>
                <p className="mt-1 text-xs text-slate-500">Watch countdowns and enforce lifecycle rules.</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Top Activity Areas</h3>
            <span className="text-xs text-slate-500">Derived from frontend demo metrics</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { label: '#general', detail: 'Highest unread volume and thread churn.' },
              { label: '#engineering', detail: 'Strong reaction density and review traffic.' },
              { label: '#incident-war-room', detail: 'Time-boxed room with urgent coordination.' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
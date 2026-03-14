export function startAuditLogStream(callback) {
  const interval = setInterval(() => {
    const actions = ['login', 'permission_change', 'file_share', 'command_usage']
    const action = actions[Math.floor(Math.random() * actions.length)]

    callback({
      id: `audit-${Date.now()}`,
      user: Math.random() > 0.5 ? 'admin' : 'ops_bot',
      action,
      detail: `Detected ${action} event`,
      timestamp: Date.now(),
      anomaly: Math.random() > 0.85,
    })
  }, 6000)

  return () => clearInterval(interval)
}

export function exportAuditLogsCsv(logs) {
  const rows = [
    ['id', 'user', 'action', 'detail', 'timestamp', 'anomaly'].join(','),
    ...logs.map((log) =>
      [
        log.id,
        log.user,
        log.action,
        `"${log.detail}"`,
        new Date(log.timestamp).toISOString(),
        log.anomaly,
      ].join(','),
    ),
  ]

  return rows.join('\n')
}
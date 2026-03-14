import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  metrics: {
    onlineUsers: 128,
    messagesPerMinute: 86,
    tempRooms: 4,
    spamAlerts: 3,
  },
  activitySeries: [
    { name: '09:00', messages: 32 },
    { name: '10:00', messages: 54 },
    { name: '11:00', messages: 72 },
    { name: '12:00', messages: 63 },
    { name: '13:00', messages: 86 },
  ],
  moderationQueue: [
    {
      id: 'mod-1',
      user: 'guest-user',
      reason: 'Potential spam burst',
      severity: 'medium',
    },
  ],
  auditLogs: [
    {
      id: 'a-1',
      user: 'admin',
      action: 'permission_change',
      detail: 'Updated channel role policy',
      timestamp: Date.now() - 1000 * 60 * 17,
      anomaly: false,
    },
    {
      id: 'a-2',
      user: 'ops_bot',
      action: 'bulk_export',
      detail: 'Exported 250 records',
      timestamp: Date.now() - 1000 * 60 * 8,
      anomaly: true,
    },
  ],
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    incrementMetric: (state, action) => {
      const metricName = action.payload
      if (state.metrics[metricName] !== undefined) {
        state.metrics[metricName] += 1
      }
    },
    addAuditLog: (state, action) => {
      state.auditLogs.unshift(action.payload)
    },
    resolveModerationItem: (state, action) => {
      state.moderationQueue = state.moderationQueue.filter((item) => item.id !== action.payload)
    },
    setTempRoomMetric: (state, action) => {
      state.metrics.tempRooms = action.payload
    },
  },
})

export const { incrementMetric, addAuditLog, resolveModerationItem, setTempRoomMetric } =
  adminSlice.actions

export const selectAdminState = (state) => state.admin

export default adminSlice.reducer
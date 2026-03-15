import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  scope: 'mentions',
  items: [],
}

const notifSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift({
        ...action.payload,
        id: `n-${Date.now()}`,
        read: false,
        timestamp: Date.now(),
      })
    },
    markRead: (state, action) => {
      const notif = state.items.find((item) => item.id === action.payload)
      if (notif) {
        notif.read = true
      }
    },
    markAllRead: (state) => {
      state.items = state.items.map((item) => ({
        ...item,
        read: true,
      }))
    },
    setNotifScope: (state, action) => {
      state.scope = action.payload
    },
  },
})

export const { addNotification, markRead, markAllRead, setNotifScope } = notifSlice.actions

export const selectNotifications = (state) => state.notifications.items
export const selectUnreadCount = (state) =>
  state.notifications.items.filter((item) => !item.read).length
export const selectNotifScope = (state) => state.notifications.scope

export default notifSlice.reducer
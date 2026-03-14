import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  scope: 'mentions',
  items: [
    {
      id: 'n-1',
      type: 'Mentions',
      text: 'Nina mentioned you in #general',
      read: false,
      timestamp: Date.now() - 1000 * 60 * 4,
    },
    {
      id: 'n-2',
      type: 'Reactions',
      text: 'Alex reacted 🎉 to your message',
      read: false,
      timestamp: Date.now() - 1000 * 60 * 9,
    },
    {
      id: 'n-3',
      type: 'System',
      text: 'Temporary room incident-war-room expires in 55m',
      read: true,
      timestamp: Date.now() - 1000 * 60 * 15,
    },
  ],
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
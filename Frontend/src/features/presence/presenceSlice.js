import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentStatus: 'Active',
  customStatus: '',
  scheduledUntil: null,
  users: [
    { id: 'u-2', name: 'Nina', status: 'On a Call' },
    { id: 'u-3', name: 'Alex', status: 'Away' },
    { id: 'u-4', name: 'Ravi', status: 'Focus Mode' },
  ],
}

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.currentStatus = action.payload
    },
    setCustomStatus: (state, action) => {
      state.customStatus = action.payload
    },
    scheduleStatus: (state, action) => {
      state.scheduledUntil = action.payload
    },
    upsertPresenceUser: (state, action) => {
      const incoming = action.payload
      const index = state.users.findIndex((user) => user.id === incoming.id)

      if (index >= 0) {
        state.users[index] = incoming
      } else {
        state.users.push(incoming)
      }
    },
  },
})

export const { setStatus, setCustomStatus, scheduleStatus, upsertPresenceUser } =
  presenceSlice.actions

export const selectPresence = (state) => state.presence

export default presenceSlice.reducer
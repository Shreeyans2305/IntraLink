import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentStatus: 'Active',
  customStatus: '',
  scheduledUntil: null,
  users: [],
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
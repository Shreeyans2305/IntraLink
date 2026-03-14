import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isOpen: false,
  parentMessage: null,
  byParent: {
    'm-1': [
      {
        id: 't-1',
        authorName: 'Omar',
        text: 'Smoke checks are green in EU region.',
        timestamp: Date.now() - 1000 * 60 * 5,
      },
      {
        id: 't-2',
        authorName: 'Nina',
        text: 'Great. Please verify US region next.',
        timestamp: Date.now() - 1000 * 60 * 4,
      },
    ],
  },
}

const threadSlice = createSlice({
  name: 'threads',
  initialState,
  reducers: {
    openThread: (state, action) => {
      state.isOpen = true
      state.parentMessage = action.payload
      if (!state.byParent[action.payload.id]) {
        state.byParent[action.payload.id] = []
      }
    },
    closeThread: (state) => {
      state.isOpen = false
      state.parentMessage = null
    },
    addThreadMessage: (state, action) => {
      const { parentId, authorName, text } = action.payload
      if (!state.byParent[parentId]) {
        state.byParent[parentId] = []
      }
      state.byParent[parentId].push({
        id: `t-${Date.now()}`,
        authorName,
        text,
        timestamp: Date.now(),
      })
    },
  },
})

export const { openThread, closeThread, addThreadMessage } = threadSlice.actions

export const selectThreadState = (state) => state.threads

export default threadSlice.reducer
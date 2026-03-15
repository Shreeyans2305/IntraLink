import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isOpen: false,
  parentMessage: null,
  byParent: {},
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
    setThreadReplies: (state, action) => {
      const { parentId, replies } = action.payload
      state.byParent[parentId] = replies
    },
    addThreadMessage: (state, action) => {
      const { parentId, reply } = action.payload
      if (!parentId || !reply) {
        return
      }

      if (!state.byParent[parentId]) {
        state.byParent[parentId] = []
      }

      state.byParent[parentId].push(reply)
    },
    receiveThreadReply: (state, action) => {
      const { parentId, reply } = action.payload
      if (!state.byParent[parentId]) {
        state.byParent[parentId] = []
      }
      state.byParent[parentId].push(reply)
    },
  },
})

export const { openThread, closeThread, setThreadReplies, addThreadMessage, receiveThreadReply } = threadSlice.actions
export const selectThreadState = (state) => state.threads

export default threadSlice.reducer
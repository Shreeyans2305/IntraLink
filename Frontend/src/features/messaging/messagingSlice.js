import { createSlice, createSelector } from '@reduxjs/toolkit'

const initialState = {
  rooms: [],
  activeRoomId: null,
  messagesByRoom: {},
  typingByRoom: {},
  pinnedByRoom: {},
  isLockdown: false,
}

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    setActiveRoom: (state, action) => {
      state.activeRoomId = action.payload
    },
    setLockdownState: (state, action) => {
      state.isLockdown = action.payload
    },
    setRooms: (state, action) => {
      state.rooms = action.payload
      if (!state.activeRoomId && action.payload.length > 0) {
        state.activeRoomId = action.payload[0].id
      }
    },
    setMessages: (state, action) => {
      const { roomId, messages } = action.payload
      state.messagesByRoom[roomId] = messages
    },
    receiveMessage: (state, action) => {
      const { roomId, ...message } = action.payload
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = []
      }
      const existingIndex = state.messagesByRoom[roomId].findIndex(
        (m) => m.id === message.id || (m.id.startsWith('pending-') && m.text === message.text && m.authorId === message.authorId)
      )
      if (existingIndex >= 0) {
        state.messagesByRoom[roomId][existingIndex] = message
      } else {
        state.messagesByRoom[roomId].push(message)
      }
    },
    sendMessage: (state, action) => {
      const {
        roomId,
        id,
        text,
        authorName,
        authorId,
        expiresAt,
        threadCount = 0,
        isSystem = false,
      } = action.payload

      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = []
      }

      state.messagesByRoom[roomId].push({
        id: id || `pending-${Date.now()}`,
        text,
        authorName,
        authorId,
        timestamp: Date.now(),
        threadCount,
        expiryAt: expiresAt ?? null,
        isSystem,
      })
    },
    addSystemMessage: (state, action) => {
      const { roomId, text } = action.payload

      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = []
      }

      state.messagesByRoom[roomId].push({
        id: `sys-${Date.now()}`,
        text,
        authorName: 'System',
        authorId: 'system',
        timestamp: Date.now(),
        threadCount: 0,
        isSystem: true,
      })
    },
    setTypingUsers: (state, action) => {
      const { roomId, users } = action.payload
      state.typingByRoom[roomId] = users
    },
    setThreadCount: (state, action) => {
      const { roomId, messageId, threadCount } = action.payload
      const messages = state.messagesByRoom[roomId] ?? []
      const message = messages.find((item) => item.id === messageId)
      if (message) {
        message.threadCount = threadCount
      }
    },
    addPinnedMessage: (state, action) => {
      const { roomId, messageId } = action.payload
      if (!state.pinnedByRoom[roomId]) {
        state.pinnedByRoom[roomId] = []
      }
      if (!state.pinnedByRoom[roomId].includes(messageId)) {
        state.pinnedByRoom[roomId].push(messageId)
      }
    },
    removeExpiredMessages: (state) => {
      const timestamp = Date.now()
      Object.keys(state.messagesByRoom).forEach((roomId) => {
        state.messagesByRoom[roomId] = state.messagesByRoom[roomId].map((message) => {
          if (message.expiryAt && message.expiryAt <= timestamp) {
            return {
              ...message,
              text: '[message expired]',
              expired: true,
            }
          }
          return message
        })
      })
    },
  },
})

export const {
  setActiveRoom,
  setRooms,
  setMessages,
  receiveMessage,
  sendMessage,
  addSystemMessage,
  setTypingUsers,
  setThreadCount,
  addPinnedMessage,
  removeExpiredMessages,
  setLockdownState,
} = messagingSlice.actions

export const selectRooms = (state) => state.messaging.rooms
export const selectActiveRoomId = (state) => state.messaging.activeRoomId
export const selectIsLockdown = (state) => state.messaging.isLockdown

const selectTypingByRoom = (state) => state.messaging.typingByRoom
const selectPinnedByRoom = (state) => state.messaging.pinnedByRoom
const selectMessagesByRoom = (state) => state.messaging.messagesByRoom

const emptyArray = []

export const selectTypingUsers = createSelector(
  [selectTypingByRoom, selectActiveRoomId],
  (typingByRoom, activeRoomId) => (activeRoomId ? (typingByRoom[activeRoomId] ?? emptyArray) : emptyArray)
)

export const selectPinnedIds = createSelector(
  [selectPinnedByRoom, selectActiveRoomId],
  (pinnedByRoom, activeRoomId) => (activeRoomId ? (pinnedByRoom[activeRoomId] ?? emptyArray) : emptyArray)
)

export const selectMessagesForActiveRoom = createSelector(
  [selectMessagesByRoom, selectActiveRoomId],
  (messagesByRoom, activeRoomId) => (activeRoomId ? (messagesByRoom[activeRoomId] ?? emptyArray) : emptyArray)
)

export default messagingSlice.reducer
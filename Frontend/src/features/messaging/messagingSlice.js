import { createSlice } from '@reduxjs/toolkit'

const now = Date.now()

const initialState = {
  rooms: [
    { id: 'room-general', name: 'general', type: 'standard' },
    { id: 'room-eng', name: 'engineering', type: 'standard' },
    {
      id: 'room-temp-war',
      name: 'incident-war-room',
      type: 'temporary',
      expiresAt: now + 1000 * 60 * 55,
    },
  ],
  activeRoomId: 'room-general',
  messagesByRoom: {
    'room-general': [
      {
        id: 'm-1',
        authorName: 'Nina',
        authorId: 'u-2',
        text: 'Deployment complete. Please verify smoke checks.',
        timestamp: now - 1000 * 60 * 12,
        threadCount: 2,
      },
      {
        id: 'm-2',
        authorName: 'Alex',
        authorId: 'u-3',
        text: 'Reminder: daily standup starts in 10 minutes.',
        timestamp: now - 1000 * 60 * 6,
        threadCount: 0,
        expiryAt: now + 1000 * 60 * 60,
      },
    ],
    'room-eng': [
      {
        id: 'm-3',
        authorName: 'Ravi',
        authorId: 'u-4',
        text: 'Can someone review PR #128?',
        timestamp: now - 1000 * 60 * 14,
        threadCount: 1,
      },
    ],
    'room-temp-war': [
      {
        id: 'm-4',
        authorName: 'System',
        authorId: 'system',
        text: 'Temporary room created for incident response. Auto-expiry enabled.',
        timestamp: now - 1000 * 60 * 2,
        isSystem: true,
        threadCount: 0,
      },
    ],
  },
  typingByRoom: {
    'room-general': ['Priya'],
    'room-eng': [],
    'room-temp-war': [],
  },
  pinnedByRoom: {
    'room-general': ['m-1'],
    'room-eng': [],
    'room-temp-war': ['m-4'],
  },
}

const createMessageId = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    setActiveRoom: (state, action) => {
      state.activeRoomId = action.payload
    },
    sendMessage: (state, action) => {
      const {
        roomId,
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
        id: createMessageId(),
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
        id: createMessageId(),
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
  sendMessage,
  addSystemMessage,
  setTypingUsers,
  setThreadCount,
  addPinnedMessage,
  removeExpiredMessages,
} = messagingSlice.actions

export const selectRooms = (state) => state.messaging.rooms
export const selectActiveRoomId = (state) => state.messaging.activeRoomId
export const selectTypingUsers = (state) =>
  state.messaging.typingByRoom[state.messaging.activeRoomId] ?? []
export const selectPinnedIds = (state) =>
  state.messaging.pinnedByRoom[state.messaging.activeRoomId] ?? []
export const selectMessagesForActiveRoom = (state) =>
  state.messaging.messagesByRoom[state.messaging.activeRoomId] ?? []

export default messagingSlice.reducer
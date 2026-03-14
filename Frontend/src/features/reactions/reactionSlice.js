import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  byMessage: {
    'm-1': {
      '👍': ['Nina', 'Alex'],
      '🎉': ['Omar'],
    },
  },
}

const reactionSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    toggleReaction: (state, action) => {
      const { messageId, emoji, actor } = action.payload

      if (!state.byMessage[messageId]) {
        state.byMessage[messageId] = {}
      }
      if (!state.byMessage[messageId][emoji]) {
        state.byMessage[messageId][emoji] = []
      }

      const existing = state.byMessage[messageId][emoji]
      if (existing.includes(actor)) {
        state.byMessage[messageId][emoji] = existing.filter((name) => name !== actor)
      } else {
        state.byMessage[messageId][emoji].push(actor)
      }
    },
  },
})

export const { toggleReaction } = reactionSlice.actions
export const selectReactionsByMessage = (state) => state.reactions.byMessage

export default reactionSlice.reducer
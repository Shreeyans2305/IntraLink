import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  byMessage: {},
}

const reactionSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    toggleReaction: (state, action) => {
      const { messageId, emoji, user } = action.payload
      if (!messageId || !emoji) {
        return
      }

      if (!state.byMessage[messageId]) {
        state.byMessage[messageId] = {}
      }

      if (!state.byMessage[messageId][emoji]) {
        state.byMessage[messageId][emoji] = []
      }

      const currentUsers = state.byMessage[messageId][emoji]
      const actor = user ?? { id: 'me', name: 'You' }
      const existingIndex = currentUsers.findIndex((item) => item.id === actor.id)

      if (existingIndex >= 0) {
        currentUsers.splice(existingIndex, 1)
      } else {
        currentUsers.push(actor)
      }

      if (!currentUsers.length) {
        delete state.byMessage[messageId][emoji]
      }
    },
    setReactions: (state, action) => {
      const { messageId, reactions } = action.payload
      state.byMessage[messageId] = reactions
    },
  },
})

export const { toggleReaction, setReactions } = reactionSlice.actions
export const selectReactionsByMessage = (state) => state.reactions.byMessage

export default reactionSlice.reducer
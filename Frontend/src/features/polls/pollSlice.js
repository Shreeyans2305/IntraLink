import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  polls: [],
}

const pollSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    createPoll: (state, action) => {
      const payload = action.payload
      const poll = {
        id: payload.id ?? `poll-${Date.now()}`,
        question: payload.question,
        roomId: payload.roomId,
        options: payload.options ?? [],
        anonymous: Boolean(payload.anonymous),
        closeAt: payload.closeAt ?? null,
        closed: Boolean(payload.closed),
      }

      state.polls.push(poll)
    },
    votePoll: (state, action) => {
      const { pollId, optionId } = action.payload
      const poll = state.polls.find((item) => item.id === pollId)
      if (!poll || poll.closed) {
        return
      }

      const option = poll.options.find((item) => item.id === optionId)
      if (!option) {
        return
      }

      option.votes = (option.votes ?? 0) + 1
    },
    closePoll: (state, action) => {
      const poll = state.polls.find((item) => item.id === action.payload)
      if (poll) {
        poll.closed = true
      }
    },
    setPolls: (state, action) => {
      state.polls = action.payload
    },
    updatePoll: (state, action) => {
      const incoming = action.payload
      const index = state.polls.findIndex((p) => p.id === incoming.id)
      if (index >= 0) {
        state.polls[index] = incoming
      } else {
        state.polls.push(incoming)
      }
    },
    removePoll: (state, action) => {
      state.polls = state.polls.filter((p) => p.id !== action.payload)
    },
  },
})

export const { createPoll, votePoll, closePoll, setPolls, updatePoll, removePoll } = pollSlice.actions
export const selectPolls = (state) => state.polls.polls

export default pollSlice.reducer
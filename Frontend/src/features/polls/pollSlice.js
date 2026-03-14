import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  polls: [
    {
      id: 'poll-1',
      roomId: 'room-general',
      question: 'Should we freeze merges before release?',
      options: [
        { id: 'opt-1', label: 'Yes', votes: 7 },
        { id: 'opt-2', label: 'No', votes: 3 },
      ],
      closed: false,
    },
  ],
}

const pollSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    createPoll: (state, action) => {
      state.polls.unshift({
        id: `poll-${Date.now()}`,
        closed: false,
        ...action.payload,
      })
    },
    votePoll: (state, action) => {
      const { pollId, optionId } = action.payload
      const poll = state.polls.find((item) => item.id === pollId)
      if (!poll || poll.closed) {
        return
      }
      poll.options = poll.options.map((option) =>
        option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
      )
    },
    closePoll: (state, action) => {
      const poll = state.polls.find((item) => item.id === action.payload)
      if (poll) {
        poll.closed = true
      }
    },
  },
})

export const { createPoll, votePoll, closePoll } = pollSlice.actions
export const selectPolls = (state) => state.polls.polls

export default pollSlice.reducer
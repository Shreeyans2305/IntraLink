import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  loading: false,
  tone: 'casual',
  smartReplies: [],
  summaryCards: [],
}

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setTone: (state, action) => {
      state.tone = action.payload
    },
    setSmartReplies: (state, action) => {
      state.smartReplies = action.payload
    },
    addSummaryCard: (state, action) => {
      state.summaryCards.unshift({
        ...action.payload,
        id: `summary-${Date.now()}`,
        collapsed: false,
      })
    },
    toggleSummaryCard: (state, action) => {
      const target = state.summaryCards.find((item) => item.id === action.payload)
      if (target) {
        target.collapsed = !target.collapsed
      }
    },
    startAiRequest: (state) => {
      state.loading = true
    },
    endAiRequest: (state) => {
      state.loading = false
    },
  },
})

export const {
  setTone,
  setSmartReplies,
  addSummaryCard,
  toggleSummaryCard,
  startAiRequest,
  endAiRequest,
} = aiSlice.actions

export const selectAiState = (state) => state.ai

export default aiSlice.reducer
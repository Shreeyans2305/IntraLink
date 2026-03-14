import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  uploads: [],
  bookmarks: [
    {
      id: 'bm-1',
      roomId: 'room-general',
      text: 'Deployment complete. Please verify smoke checks.',
      tags: ['release', 'ops'],
      note: 'Useful reference for rollout checklist.',
      savedAt: Date.now() - 1000 * 60 * 45,
    },
  ],
}

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addUpload: (state, action) => {
      state.uploads.unshift(action.payload)
    },
    markUploadDecrypted: (state, action) => {
      const item = state.uploads.find((upload) => upload.id === action.payload)
      if (item) {
        item.decrypted = true
      }
    },
    addBookmark: (state, action) => {
      state.bookmarks.unshift({
        id: `bm-${Date.now()}`,
        ...action.payload,
        tags: action.payload.tags ?? ['quick-save'],
        note: action.payload.note ?? '',
        savedAt: Date.now(),
      })
    },
    removeBookmark: (state, action) => {
      state.bookmarks = state.bookmarks.filter((bookmark) => bookmark.id !== action.payload)
    },
    updateBookmarkMeta: (state, action) => {
      const { id, tags, note } = action.payload
      const bookmark = state.bookmarks.find((item) => item.id === id)
      if (bookmark) {
        bookmark.tags = tags ?? bookmark.tags ?? []
        bookmark.note = note ?? bookmark.note ?? ''
      }
    },
  },
})

export const { addUpload, markUploadDecrypted, addBookmark, removeBookmark, updateBookmarkMeta } =
  fileSlice.actions
export const selectFileState = (state) => state.files

export default fileSlice.reducer
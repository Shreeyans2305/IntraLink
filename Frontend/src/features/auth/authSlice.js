import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  role: null,
  authenticated: false,
  preferences: {
    smartRepliesEnabled: true,
    tone: 'casual',
    notificationScope: 'mentions',
    theme: 'slate',
    density: 'comfortable',
    reducedMotion: false,
  },
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token ?? 'demo-token'
      state.role = user.org_role ?? user.role ?? 'user'
      state.authenticated = true
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.role = null
      state.authenticated = false
    },
    setPreference: (state, action) => {
      const { key, value } = action.payload
      state.preferences[key] = value
    },
  },
})

export const { loginSuccess, logout, setPreference } = authSlice.actions

export const selectAuth = (state) => state.auth
export const selectCurrentUser = (state) => state.auth.user
export const selectUserPreferences = (state) => state.auth.preferences
export const selectIsAuthenticated = (state) => state.auth.authenticated
export const selectIsAdmin = (state) => state.auth.role === 'admin'

export default authSlice.reducer
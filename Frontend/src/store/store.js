import { combineReducers, configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import messagingReducer from '../features/messaging/messagingSlice'
import tempRoomReducer from '../features/temprooms/tempRoomSlice'
import threadReducer from '../features/threads/threadSlice'
import reactionReducer from '../features/reactions/reactionSlice'
import presenceReducer from '../features/presence/presenceSlice'
import notificationReducer from '../features/notifications/notifSlice'
import aiReducer from '../features/ai/aiSlice'
import pollReducer from '../features/polls/pollSlice'
import adminReducer from '../features/admin/adminSlice'
import fileReducer from '../features/files/fileSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  messaging: messagingReducer,
  temprooms: tempRoomReducer,
  threads: threadReducer,
  reactions: reactionReducer,
  presence: presenceReducer,
  notifications: notificationReducer,
  ai: aiReducer,
  polls: pollReducer,
  admin: adminReducer,
  files: fileReducer,
})

export const store = configureStore({
  reducer: rootReducer,
})

export default store
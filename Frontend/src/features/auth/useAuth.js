import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginApi, registerApi } from './authApi'
import { loginSuccess, logout, selectAuth } from './authSlice'
import { setApiAuthToken } from '../../services/apiClient'
import { getSocket } from '../../services/websocket'

export function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = useSelector(selectAuth)

  const login = async (credentials) => {
    const response = await loginApi(credentials)
    // Set the JWT on the axios client for all future calls
    setApiAuthToken(response.token)
    // Connect the socket with the JWT in auth handshake
    const socket = getSocket()
    socket.auth = { token: response.token }
    dispatch(loginSuccess(response))
    navigate('/chat')
  }

  const register = async (payload) => {
    const response = await registerApi(payload)
    setApiAuthToken(response.token)
    const socket = getSocket()
    socket.auth = { token: response.token }
    dispatch(loginSuccess(response))
    navigate('/chat')
  }

  const signOut = () => {
    setApiAuthToken(null)
    const socket = getSocket()
    if (socket.connected) socket.disconnect()
    dispatch(logout())
    navigate('/login')
  }

  return {
    auth,
    login,
    register,
    signOut,
  }
}
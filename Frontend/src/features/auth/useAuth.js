import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginApi, registerApi } from './authApi'
import { loginSuccess, logout, selectAuth } from './authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = useSelector(selectAuth)

  const login = async (credentials) => {
    const response = await loginApi(credentials)
    dispatch(loginSuccess(response))
    navigate('/chat')
  }

  const register = async (payload) => {
    const response = await registerApi(payload)
    dispatch(loginSuccess(response))
    navigate('/chat')
  }

  const signOut = () => {
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
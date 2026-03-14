import { useDispatch, useSelector } from 'react-redux'
import { selectPresence, setCustomStatus, setStatus } from './presenceSlice'

export function usePresence() {
  const dispatch = useDispatch()
  const presence = useSelector(selectPresence)

  return {
    ...presence,
    updateStatus: (status) => dispatch(setStatus(status)),
    updateCustomStatus: (text) => dispatch(setCustomStatus(text)),
  }
}
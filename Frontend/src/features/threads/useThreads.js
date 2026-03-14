import { useDispatch, useSelector } from 'react-redux'
import { addThreadMessage, closeThread, openThread, selectThreadState } from './threadSlice'

export function useThreads() {
  const dispatch = useDispatch()
  const threadState = useSelector(selectThreadState)

  return {
    ...threadState,
    open: (message) => dispatch(openThread(message)),
    close: () => dispatch(closeThread()),
    addMessage: (payload) => dispatch(addThreadMessage(payload)),
  }
}
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { expireRooms } from './tempRoomSlice'

export function useRoomTimer() {
  const dispatch = useDispatch()

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(expireRooms())
    }, 1000)

    return () => clearInterval(interval)
  }, [dispatch])
}
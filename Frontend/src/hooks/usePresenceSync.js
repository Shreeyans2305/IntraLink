import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { upsertPresenceUser } from '../features/presence/presenceSlice'
import { getSocket } from '../services/websocket'

export function usePresenceSync() {
  const dispatch = useDispatch()

  useEffect(() => {
    const socket = getSocket()

    const handler = (presencePayload) => {
      dispatch(upsertPresenceUser(presencePayload))
    }

    socket.on('presence:update', handler)

    return () => {
      socket.off('presence:update', handler)
    }
  }, [dispatch])
}
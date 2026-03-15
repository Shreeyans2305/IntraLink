import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { upsertPresenceUser } from '../features/presence/presenceSlice'
import { getSocket } from '../services/websocket'

export function usePresenceSync() {
  const dispatch = useDispatch()

  useEffect(() => {
    const socket = getSocket()

    const handler = (presencePayload) => {
      dispatch(
        upsertPresenceUser({
          id: presencePayload.user_id,
          name: presencePayload.name,
          status: presencePayload.status,
          customStatus: presencePayload.custom_status,
        }),
      )
    }

    socket.on('presence_update', handler)

    return () => {
      socket.off('presence_update', handler)
    }
  }, [dispatch])
}
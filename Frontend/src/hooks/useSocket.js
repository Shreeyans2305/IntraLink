import { useEffect, useState } from 'react'
import { connectSocket, disconnectSocket, getSocket } from '../services/websocket'

export function useSocket({ autoConnect = false } = {}) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    if (autoConnect) {
      connectSocket()
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      if (autoConnect) {
        disconnectSocket()
      }
    }
  }, [autoConnect])

  return {
    socket: getSocket(),
    connected,
  }
}
import { io } from 'socket.io-client'

let socket

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      transports: ['websocket'],
    })
  }

  return socket
}

export function connectSocket() {
  const instance = getSocket()
  if (!instance.connected) {
    instance.connect()
  }
  return instance
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}
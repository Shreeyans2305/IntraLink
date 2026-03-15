import apiClient from '../../services/apiClient'

export async function fetchRooms() {
  const { data } = await apiClient.get('/rooms/')
  return data
}

export async function fetchUsers() {
  const { data } = await apiClient.get('/admin/users')
  return data
}

export async function fetchMessages(roomId) {
  const { data } = await apiClient.get(`/rooms/${roomId}/messages`)
  return data.map(m => ({
    id: m.id,
    text: m.text,
    authorName: m.author_name,
    authorId: m.author_id,
    timestamp: m.timestamp,
    threadCount: m.thread_count || 0,
    isSystem: m.is_system || false,
    expiryAt: m.expires_at,
  }))
}

export async function joinRoom(roomId) {
  const { data } = await apiClient.post(`/rooms/${roomId}/join`)
  return data
}

export async function pinMessage(roomId, messageId) {
  const { data } = await apiClient.post(`/rooms/${roomId}/messages/${messageId}/pin`)
  return data
}

export async function createRoom(payload) {
  const { data } = await apiClient.post('/rooms/', payload)
  return data
}

export async function deleteRoom(roomId) {
  const { data } = await apiClient.delete(`/rooms/${roomId}`)
  return data
}

export async function addRoomMember(roomId, payload) {
  const { data } = await apiClient.post(`/rooms/${roomId}/members`, payload)
  return data
}

export async function updateRoomMember(roomId, userId, payload) {
  const { data } = await apiClient.put(`/rooms/${roomId}/members/${userId}`, payload)
  return data
}

export async function kickRoomMember(roomId, userId) {
  const { data } = await apiClient.delete(`/rooms/${roomId}/members/${userId}`)
  return data
}

export async function muteMember(roomId, userId) {
  const { data } = await apiClient.post(`/rooms/${roomId}/mute/${userId}`)
  return data
}

export async function unmuteMember(roomId, userId) {
  const { data } = await apiClient.post(`/rooms/${roomId}/unmute/${userId}`)
  return data
}

import apiClient from '../../services/apiClient'

export async function createTemporaryRoomApi(payload) {
  const response = await apiClient.post('/temprooms/', payload)
  return response.data
}

export async function extendTemporaryRoomApi({ tempId, duration }) {
  const response = await apiClient.put(`/temprooms/${tempId}/extend`, { duration })
  return response.data
}

export async function terminateTemporaryRoomApi(tempId) {
  const response = await apiClient.delete(`/temprooms/${tempId}`)
  return response.data
}

export async function listTempRoomsApi() {
  const response = await apiClient.get('/temprooms/')
  return response.data
}
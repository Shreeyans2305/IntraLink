import apiClient from '../../services/apiClient'

export const createPollApi = async (roomId, payload) => {
  const response = await apiClient.post(`/rooms/${roomId}/polls/`, payload)
  return response.data
}

export const fetchPollsApi = async (roomId) => {
  const response = await apiClient.get(`/rooms/${roomId}/polls/`)
  return response.data
}

export const closePollApi = async (roomId, pollId) => {
  const response = await apiClient.put(`/rooms/${roomId}/polls/${pollId}/close`)
  return response.data
}

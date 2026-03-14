import apiClient from '../../services/apiClient'

export async function loginApi(credentials) {
  const response = await apiClient.post('/auth/login', credentials)
  return response.data
}

export async function registerApi(payload) {
  const response = await apiClient.post('/auth/register', payload)
  return response.data
}

export async function getMeApi() {
  const response = await apiClient.get('/auth/me')
  return response.data
}